import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eraser,
    Type,
    Palette,
    Check,
    X,
    AlertCircle,
    CheckCircle,
    Wand2
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import { removeRegion } from '../utils/pdfImageRemover';
import { addText, replaceText } from '../utils/pdfTextEditor';

/**
 * TextEditTool - Seçilen bölge için düzenleme araçları
 */
export default function TextEditTool({
    pdfData,
    currentPage,
    selection,
    pageHeight,
    onPdfUpdate,
    onClearSelection
}) {
    const [mode, setMode] = useState('mask'); // 'mask' | 'addText' | 'replace'
    const [newText, setNewText] = useState('');
    const [fontSize, setFontSize] = useState(12);
    const [maskColor, setMaskColor] = useState('#ffffff');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [smartMode, setSmartMode] = useState(true); // Akıllı mod - arka plan rengi otomatik

    // Canvas koordinatlarını PDF koordinatlarına dönüştür (Y ekseni ters, scale hesaba kat)
    const convertToPdfCoords = useCallback((canvasSelection) => {
        if (!canvasSelection || !pageHeight) return null;

        const scale = canvasSelection.scale || 1;

        // Canvas koordinatlarını scale'e göre böl
        const x = canvasSelection.x / scale;
        const y = canvasSelection.y / scale;
        const width = canvasSelection.width / scale;
        const height = canvasSelection.height / scale;

        return {
            x: x,
            // PDF'de Y ekseni alttan başlar
            y: pageHeight - y - height,
            width: width,
            height: height,
        };
    }, [pageHeight]);

    const handleMaskRegion = useCallback(async () => {
        if (!pdfData || !selection) {
            setMessage({ type: 'error', text: 'Lütfen bir bölge seçin' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            // Koordinat doğrulama
            if (!pageHeight || pageHeight <= 0) {
                throw new Error('PDF sayfa boyutu bulunamadı. Lütfen PDF yeniden yükleyin.');
            }

            const pdfCoords = convertToPdfCoords(selection);
            if (!pdfCoords || pdfCoords.width <= 0 || pdfCoords.height <= 0) {
                throw new Error('Geçersiz seçim koordinatları. Lütfen tekrar seçim yapın.');
            }

            // Rengi RGB'ye çevir (0-1 arası)
            const hex = maskColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            console.log('Maskeleme yapılıyor:', { pdfCoords, color: { r, g, b }, pageHeight });

            const newPdfData = await Promise.race([
                removeRegion(pdfData, currentPage, pdfCoords, { fillColor: { r, g, b } }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('İşlem zaman aşımına uğradı')), 30000)
                )
            ]);

            if (!newPdfData || newPdfData.length === 0) {
                throw new Error('PDF oluşturulamadı');
            }

            onPdfUpdate?.(new Uint8Array(newPdfData));
            onClearSelection?.();
            setMessage({ type: 'success', text: 'Bölge başarıyla maskelendi' });
        } catch (error) {
            console.error('Maskeleme hatası:', error);
            const errorMsg = error.message || 'Bilinmeyen bir hata oluştu';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    }, [pdfData, selection, currentPage, maskColor, pageHeight, convertToPdfCoords, onPdfUpdate, onClearSelection]);

    const handleAddText = useCallback(async () => {
        if (!pdfData || !selection || !newText.trim()) {
            setMessage({ type: 'error', text: 'Lütfen metin girin' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const pdfCoords = convertToPdfCoords(selection);
            if (!pdfCoords) throw new Error('Koordinat dönüşüm hatası');

            const newPdfData = await Promise.race([
                addText(
                    pdfData,
                    currentPage,
                    newText,
                    { x: pdfCoords.x, y: pdfCoords.y + pdfCoords.height - fontSize },
                    { fontSize }
                ),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('İşlem zaman aşımına uğradı')), 30000)
                )
            ]);

            onPdfUpdate?.(new Uint8Array(newPdfData));
            onClearSelection?.();
            setNewText('');
            setMessage({ type: 'success', text: 'Metin eklendi' });
        } catch (error) {
            console.error('Metin ekleme hatası:', error);
            setMessage({ type: 'error', text: error.message || 'Metin eklenirken hata oluştu' });
        } finally {
            setLoading(false);
        }
    }, [pdfData, selection, currentPage, newText, fontSize, convertToPdfCoords, onPdfUpdate, onClearSelection]);

    const handleReplaceText = useCallback(async () => {
        if (!pdfData || !selection) return;

        setLoading(true);
        setMessage(null);

        try {
            const pdfCoords = convertToPdfCoords(selection);
            if (!pdfCoords) throw new Error('Koordinat dönüşüm hatası');

            // Rengi RGB'ye çevir
            const hex = maskColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            const newPdfData = await replaceText(
                pdfData,
                currentPage,
                pdfCoords,
                newText,
                {
                    fontSize,
                    backgroundColor: { r, g, b }
                }
            );

            onPdfUpdate?.(newPdfData);
            onClearSelection?.();
            setNewText('');
            setMessage({ type: 'success', text: 'Metin değiştirildi' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Hata: ' + error.message });
        } finally {
            setLoading(false);
        }
    }, [pdfData, selection, currentPage, newText, fontSize, maskColor, convertToPdfCoords, onPdfUpdate, onClearSelection]);

    const colorPresets = [
        { color: '#ffffff', label: 'Beyaz' },
        { color: '#000000', label: 'Siyah' },
        { color: '#f5f5dc', label: 'Bej' },
        { color: '#fffaf0', label: 'Krem' },
    ];

    return (
        <div className="space-y-4">
            {/* Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'error'
                            ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                            : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                            }`}
                    >
                        {message.type === 'error'
                            ? <AlertCircle className="w-4 h-4" />
                            : <CheckCircle className="w-4 h-4" />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selection Info */}
            {selection ? (
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-300">Seçilen Bölge</span>
                        <button
                            onClick={onClearSelection}
                            className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 grid grid-cols-2 gap-2">
                        <span>Konum: {Math.round(selection.x)}, {Math.round(selection.y)}</span>
                        <span>Boyut: {Math.round(selection.width)} x {Math.round(selection.height)}</span>
                    </div>
                </GlassCard>
            ) : (
                <GlassCard className="p-4 text-center">
                    <p className="text-gray-400 text-sm">
                        PDF üzerinde fare ile bir bölge seçin
                    </p>
                </GlassCard>
            )}

            {/* Mode Selection */}
            <GlassCard className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">İşlem Türü</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => setMode('mask')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'mask'
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <Eraser className="w-4 h-4" />
                        Sil
                    </button>
                    <button
                        onClick={() => setMode('addText')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'addText'
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <Type className="w-4 h-4" />
                        Ekle
                    </button>
                    <button
                        onClick={() => setMode('replace')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${mode === 'replace'
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        <Palette className="w-4 h-4" />
                        Değiştir
                    </button>
                </div>
            </GlassCard>

            {/* Mode-specific options */}
            {mode === 'mask' && (
                <GlassCard className="p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Maskeleme Rengi</p>
                    <div className="flex gap-2">
                        {colorPresets.map((preset) => (
                            <button
                                key={preset.color}
                                onClick={() => setMaskColor(preset.color)}
                                className={`w-8 h-8 rounded-lg border-2 transition-all ${maskColor === preset.color
                                    ? 'border-purple-500 scale-110'
                                    : 'border-gray-600 hover:border-gray-400'
                                    }`}
                                style={{ backgroundColor: preset.color }}
                                title={preset.label}
                            />
                        ))}
                        <input
                            type="color"
                            value={maskColor}
                            onChange={(e) => setMaskColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border-2 border-gray-600 cursor-pointer"
                        />
                    </div>
                </GlassCard>
            )}

            {(mode === 'addText' || mode === 'replace') && (
                <GlassCard className="p-4 space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                            Metin
                        </label>
                        <textarea
                            value={newText}
                            onChange={(e) => setNewText(e.target.value)}
                            placeholder="Eklenecek metni yazın..."
                            className="w-full bg-white/5 border border-purple-500/30 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 min-h-[80px] resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                            Font Boyutu: {fontSize}px
                        </label>
                        <input
                            type="range"
                            min="8"
                            max="48"
                            value={fontSize}
                            onChange={(e) => setFontSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                    {mode === 'replace' && (
                        <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
                                Arka Plan Rengi
                            </label>
                            <div className="flex gap-2">
                                {colorPresets.map((preset) => (
                                    <button
                                        key={preset.color}
                                        onClick={() => setMaskColor(preset.color)}
                                        className={`w-8 h-8 rounded-lg border-2 transition-all ${maskColor === preset.color
                                            ? 'border-purple-500 scale-110'
                                            : 'border-gray-600 hover:border-gray-400'
                                            }`}
                                        style={{ backgroundColor: preset.color }}
                                        title={preset.label}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </GlassCard>
            )}

            {/* Action Button */}
            <NeonButton
                onClick={
                    mode === 'mask' ? handleMaskRegion :
                        mode === 'addText' ? handleAddText :
                            handleReplaceText
                }
                disabled={!selection || loading || (mode !== 'mask' && !newText.trim())}
                loading={loading}
                icon={<Check className="w-4 h-4" />}
                className="w-full"
            >
                {mode === 'mask' ? 'Bölgeyi Sil' :
                    mode === 'addText' ? 'Metin Ekle' :
                        'Metni Değiştir'}
            </NeonButton>
        </div>
    );
}
