import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Image,
    Trash2,
    Download,
    AlertCircle,
    CheckCircle,
    Loader2,
    Eye,
    EyeOff
} from 'lucide-react';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import { detectImages, removeImages, removeAllImages } from '../utils/pdfImageRemover';

/**
 * ImageRemovalTool - PDF'den görsel silme aracı
 */
export default function ImageRemovalTool({ pdfData, onPdfUpdate }) {
    const [images, setImages] = useState([]);
    const [selectedImages, setSelectedImages] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleDetectImages = useCallback(async () => {
        if (!pdfData) {
            setMessage({ type: 'error', text: 'Önce bir PDF dosyası yükleyin' });
            return;
        }

        setDetecting(true);
        try {
            const detectedImages = await detectImages(pdfData);
            setImages(detectedImages);
            setSelectedImages(new Set(detectedImages.map(img => img.id)));

            if (detectedImages.length === 0) {
                setMessage({ type: 'info', text: 'PDF\'de görsel bulunamadı' });
            } else {
                setMessage({ type: 'success', text: `${detectedImages.length} görsel tespit edildi` });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Görsel tespit hatası: ' + error.message });
        } finally {
            setDetecting(false);
        }
    }, [pdfData]);

    const handleRemoveSelected = useCallback(async () => {
        if (selectedImages.size === 0) {
            setMessage({ type: 'error', text: 'Silinecek görsel seçin' });
            return;
        }

        setLoading(true);
        try {
            const imagesToRemove = images.filter(img => selectedImages.has(img.id));
            const newPdfData = await removeImages(pdfData, imagesToRemove);
            onPdfUpdate?.(newPdfData);

            // Removed images from list
            setImages(prev => prev.filter(img => !selectedImages.has(img.id)));
            setSelectedImages(new Set());
            setMessage({ type: 'success', text: `${imagesToRemove.length} görsel silindi` });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Silme hatası: ' + error.message });
        } finally {
            setLoading(false);
        }
    }, [pdfData, images, selectedImages, onPdfUpdate]);

    const handleRemoveAll = useCallback(async () => {
        if (!pdfData) return;

        setLoading(true);
        try {
            const newPdfData = await removeAllImages(pdfData);
            onPdfUpdate?.(newPdfData);
            setImages([]);
            setSelectedImages(new Set());
            setMessage({ type: 'success', text: 'Tüm görseller silindi' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Silme hatası: ' + error.message });
        } finally {
            setLoading(false);
        }
    }, [pdfData, onPdfUpdate]);

    const toggleImageSelection = (imageId) => {
        setSelectedImages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) {
                newSet.delete(imageId);
            } else {
                newSet.add(imageId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedImages.size === images.length) {
            setSelectedImages(new Set());
        } else {
            setSelectedImages(new Set(images.map(img => img.id)));
        }
    };

    return (
        <div className="space-y-6">
            {/* Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'error' ? 'bg-red-500/20 border border-red-500/30' :
                                message.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                                    'bg-blue-500/20 border border-blue-500/30'
                            }`}
                    >
                        {message.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-400" /> :
                            message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                                <AlertCircle className="w-5 h-5 text-blue-400" />}
                        <span className={
                            message.type === 'error' ? 'text-red-300' :
                                message.type === 'success' ? 'text-emerald-300' :
                                    'text-blue-300'
                        }>{message.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Buttons */}
            <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Görsel Silme Araçları</h3>

                <div className="flex flex-wrap gap-3">
                    <NeonButton
                        onClick={handleDetectImages}
                        disabled={!pdfData || detecting}
                        loading={detecting}
                        icon={<Image className="w-4 h-4" />}
                    >
                        Görselleri Tespit Et
                    </NeonButton>

                    <NeonButton
                        variant="ghost"
                        onClick={handleRemoveSelected}
                        disabled={selectedImages.size === 0 || loading}
                        loading={loading}
                        icon={<Trash2 className="w-4 h-4" />}
                    >
                        Seçilenleri Sil ({selectedImages.size})
                    </NeonButton>

                    <NeonButton
                        variant="emerald"
                        onClick={handleRemoveAll}
                        disabled={!pdfData || loading}
                        loading={loading}
                        icon={<Trash2 className="w-4 h-4" />}
                    >
                        Tümünü Sil
                    </NeonButton>
                </div>
            </GlassCard>

            {/* Detected Images List */}
            {images.length > 0 && (
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-200">
                            Tespit Edilen Görseller ({images.length})
                        </h3>
                        <button
                            onClick={toggleSelectAll}
                            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                            {selectedImages.size === images.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {images.map((img) => (
                            <motion.div
                                key={img.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${selectedImages.has(img.id)
                                        ? 'bg-purple-500/20 border border-purple-500/30'
                                        : 'bg-white/5 hover:bg-white/10'
                                    }`}
                                onClick={() => toggleImageSelection(img.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedImages.has(img.id)
                                            ? 'border-purple-500 bg-purple-500'
                                            : 'border-gray-500'
                                        }`}>
                                        {selectedImages.has(img.id) && (
                                            <CheckCircle className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <Image className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-200">Sayfa {img.pageNum}</p>
                                        <p className="text-xs text-gray-500">
                                            {Math.round(img.width)} x {Math.round(img.height)} px
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                    ({Math.round(img.x)}, {Math.round(img.y)})
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Instructions */}
            {!pdfData && (
                <GlassCard className="p-6 text-center">
                    <Image className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                    <p className="text-gray-400">
                        PDF dosyası yükleyin ve görselleri tespit edin
                    </p>
                </GlassCard>
            )}
        </div>
    );
}
