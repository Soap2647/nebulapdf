import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * SelectionOverlay - PDF üzerinde fare ile seçim yapma bileşeni
 * @param {Object} props
 * @param {boolean} props.enabled - Seçim modu aktif mi
 * @param {number} props.canvasWidth - Canvas genişliği
 * @param {number} props.canvasHeight - Canvas yüksekliği
 * @param {number} props.scale - PDF ölçeği
 * @param {Function} props.onSelectionComplete - Seçim tamamlandığında
 * @param {Object} props.selection - Mevcut seçim {x, y, width, height}
 */
export default function SelectionOverlay({
    enabled,
    canvasWidth,
    canvasHeight,
    scale = 1,
    onSelectionComplete,
    selection: externalSelection,
}) {
    const overlayRef = useRef(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [currentSelection, setCurrentSelection] = useState(null);

    // External selection prop'u ile senkronize et
    useEffect(() => {
        if (externalSelection) {
            setCurrentSelection(externalSelection);
        }
    }, [externalSelection]);

    const getMousePos = useCallback((e) => {
        if (!overlayRef.current) return { x: 0, y: 0 };
        const rect = overlayRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    }, []);

    const handleMouseDown = useCallback((e) => {
        if (!enabled) return;
        e.preventDefault();
        const pos = getMousePos(e);
        setStartPoint(pos);
        setIsSelecting(true);
        setCurrentSelection(null);
    }, [enabled, getMousePos]);

    const handleMouseMove = useCallback((e) => {
        if (!isSelecting || !startPoint) return;
        const pos = getMousePos(e);

        const x = Math.min(startPoint.x, pos.x);
        const y = Math.min(startPoint.y, pos.y);
        const width = Math.abs(pos.x - startPoint.x);
        const height = Math.abs(pos.y - startPoint.y);

        setCurrentSelection({ x, y, width, height });
    }, [isSelecting, startPoint, getMousePos]);

    const handleMouseUp = useCallback(() => {
        if (!isSelecting || !currentSelection) {
            setIsSelecting(false);
            return;
        }

        setIsSelecting(false);

        // Minimum boyut kontrolü
        if (currentSelection.width > 10 && currentSelection.height > 10) {
            // Canvas koordinatlarını PDF koordinatlarına dönüştür
            const pdfSelection = {
                x: currentSelection.x / scale,
                y: currentSelection.y / scale,
                width: currentSelection.width / scale,
                height: currentSelection.height / scale,
                // Orijinal canvas koordinatları
                canvasCoords: { ...currentSelection },
            };
            onSelectionComplete?.(pdfSelection);
        }
    }, [isSelecting, currentSelection, scale, onSelectionComplete]);

    const clearSelection = useCallback(() => {
        setCurrentSelection(null);
        onSelectionComplete?.(null);
    }, [onSelectionComplete]);

    if (!enabled && !currentSelection) return null;

    return (
        <div
            ref={overlayRef}
            className="absolute inset-0 z-10"
            style={{
                width: canvasWidth || '100%',
                height: canvasHeight || '100%',
                cursor: enabled ? 'crosshair' : 'default',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Selection Rectangle */}
            {currentSelection && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute border-2 border-purple-500 bg-purple-500/20 pointer-events-none"
                    style={{
                        left: currentSelection.x,
                        top: currentSelection.y,
                        width: currentSelection.width,
                        height: currentSelection.height,
                        boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                    }}
                >
                    {/* Resize handles */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 rounded-full" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 rounded-full" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full" />
                </motion.div>
            )}

            {/* Clear button */}
            {currentSelection && !isSelecting && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        clearSelection();
                    }}
                    className="absolute bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-auto"
                    style={{
                        left: currentSelection.x + currentSelection.width - 20,
                        top: currentSelection.y - 30,
                    }}
                >
                    ✕
                </motion.button>
            )}

            {/* Selection info */}
            {currentSelection && !isSelecting && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bg-gray-900/90 text-white text-xs px-2 py-1 rounded pointer-events-none"
                    style={{
                        left: currentSelection.x,
                        top: currentSelection.y + currentSelection.height + 5,
                    }}
                >
                    {Math.round(currentSelection.width / scale)} x {Math.round(currentSelection.height / scale)} px
                </motion.div>
            )}
        </div>
    );
}
