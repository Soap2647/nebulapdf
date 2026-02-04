import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ZoomIn,
    ZoomOut,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    MousePointer2,
    Hand
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import SelectionOverlay from './SelectionOverlay';

// PDF.js worker setup - yerel dosya kullan
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * PDFViewer - PDF görüntüleme bileşeni (seçim desteği ile)
 */
export default function PDFViewer({
    pdfSource,
    onPageSelect,
    onPdfLoaded,
    showControls = true,
    selectionEnabled = false,
    onSelectionChange,
    selection,
}) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [scale, setScale] = useState(1.5);
    const [rotation, setRotation] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
    const [pageHeight, setPageHeight] = useState(0);
    const [selectionMode, setSelectionMode] = useState(false);

    // Load PDF
    useEffect(() => {
        if (!pdfSource) return;

        const loadPdf = async () => {
            setLoading(true);
            setError(null);

            try {
                let source;
                if (pdfSource instanceof File) {
                    source = await pdfSource.arrayBuffer();
                } else if (pdfSource instanceof Uint8Array) {
                    source = pdfSource.slice().buffer;
                } else {
                    source = pdfSource;
                }

                const pdf = await pdfjsLib.getDocument({ data: source }).promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setCurrentPage(1);

                // İlk sayfanın boyutunu al
                const page = await pdf.getPage(1);
                const viewport = page.getViewport({ scale: 1 });
                setPageHeight(viewport.height);

                onPdfLoaded?.({ numPages: pdf.numPages, pdf, pageHeight: viewport.height });
            } catch (err) {
                console.error('PDF yükleme hatası:', err);
                setError('PDF dosyası yüklenirken bir hata oluştu');
            } finally {
                setLoading(false);
            }
        };

        loadPdf();
    }, [pdfSource, onPdfLoaded]);

    // Render page
    const renderPage = useCallback(async () => {
        if (!pdfDoc || !canvasRef.current) return;

        try {
            const page = await pdfDoc.getPage(currentPage);
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            const viewport = page.getViewport({ scale, rotation });
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // Sayfa yüksekliğini güncelle
            const unscaledViewport = page.getViewport({ scale: 1, rotation });
            setPageHeight(unscaledViewport.height);

            // Canvas boyutlarını kaydet
            setCanvasDimensions({ width: viewport.width, height: viewport.height });

            await page.render({
                canvasContext: context,
                viewport,
            }).promise;

            onPageSelect?.(currentPage);
        } catch (err) {
            console.error('Sayfa render hatası:', err);
        }
    }, [pdfDoc, currentPage, scale, rotation, onPageSelect]);

    useEffect(() => {
        renderPage();
    }, [renderPage]);

    const goToPage = (pageNum) => {
        if (pageNum >= 1 && pageNum <= totalPages) {
            setCurrentPage(pageNum);
            onSelectionChange?.(null); // Sayfa değişince seçimi temizle
        }
    };

    const zoomIn = () => setScale(s => Math.min(s + 0.25, 4));
    const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
    const rotate = () => setRotation(r => (r + 90) % 360);

    const toggleSelectionMode = () => {
        const newMode = !selectionMode;
        setSelectionMode(newMode);
        if (!newMode) {
            onSelectionChange?.(null);
        }
    };

    const handleSelectionComplete = (sel) => {
        if (sel) {
            onSelectionChange?.({
                ...sel,
                pageNum: currentPage,
                scale,
                pageHeight,
            });
        } else {
            onSelectionChange?.(null);
        }
    };

    if (error) {
        return (
            <div className="glass-card p-8 text-center">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Controls */}
            {showControls && pdfDoc && (
                <motion.div
                    className="glass mb-4 p-3 flex items-center justify-between"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Page Navigation */}
                    <div className="flex items-center gap-2">
                        <ControlButton
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </ControlButton>

                        <div className="flex items-center gap-2 px-3">
                            <input
                                type="number"
                                value={currentPage}
                                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                                className="w-12 bg-white/10 border border-purple-500/30 rounded px-2 py-1 text-center text-sm"
                                min={1}
                                max={totalPages}
                            />
                            <span className="text-gray-400 text-sm">/ {totalPages}</span>
                        </div>

                        <ControlButton
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </ControlButton>
                    </div>

                    {/* Zoom & Rotate */}
                    <div className="flex items-center gap-2">
                        <ControlButton onClick={zoomOut} disabled={scale <= 0.5}>
                            <ZoomOut className="w-4 h-4" />
                        </ControlButton>

                        <span className="text-sm text-gray-400 w-16 text-center">
                            {Math.round(scale * 100)}%
                        </span>

                        <ControlButton onClick={zoomIn} disabled={scale >= 4}>
                            <ZoomIn className="w-4 h-4" />
                        </ControlButton>

                        <div className="w-px h-6 bg-purple-500/30 mx-2" />

                        <ControlButton onClick={rotate}>
                            <RotateCw className="w-4 h-4" />
                        </ControlButton>

                        {/* Selection Mode Toggle */}
                        {selectionEnabled && (
                            <>
                                <div className="w-px h-6 bg-purple-500/30 mx-2" />
                                <ControlButton
                                    onClick={toggleSelectionMode}
                                    active={selectionMode}
                                >
                                    {selectionMode ? (
                                        <MousePointer2 className="w-4 h-4" />
                                    ) : (
                                        <Hand className="w-4 h-4" />
                                    )}
                                </ControlButton>
                            </>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Canvas Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto flex items-center justify-center p-4 glass-card"
            >
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <motion.div
                                className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            <p className="text-gray-400">PDF yükleniyor...</p>
                        </motion.div>
                    ) : pdfDoc ? (
                        <div className="relative inline-block">
                            <motion.canvas
                                key="canvas"
                                ref={canvasRef}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="shadow-2xl rounded-lg"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />

                            {/* Selection Overlay */}
                            {selectionEnabled && (
                                <SelectionOverlay
                                    enabled={selectionMode}
                                    canvasWidth={canvasDimensions.width}
                                    canvasHeight={canvasDimensions.height}
                                    scale={scale}
                                    onSelectionComplete={handleSelectionComplete}
                                    selection={selection?.canvasCoords}
                                />
                            )}
                        </div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center text-gray-500"
                        >
                            <p>PDF dosyası seçin</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function ControlButton({ children, onClick, disabled, active }) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors ${disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : active
                        ? 'text-purple-400 bg-purple-500/20'
                        : 'text-gray-300 hover:bg-purple-500/20 hover:text-purple-400'
                }`}
            whileHover={!disabled ? { scale: 1.05 } : undefined}
            whileTap={!disabled ? { scale: 0.95 } : undefined}
        >
            {children}
        </motion.button>
    );
}
