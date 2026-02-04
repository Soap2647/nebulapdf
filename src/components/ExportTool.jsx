import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    FileImage,
    FileText,
    CheckCircle,
    AlertCircle,
    Settings,
    Archive
} from 'lucide-react';
import JSZip from 'jszip';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';
import {
    downloadPageAsPng,
    downloadPageAsJpg,
    exportAllPagesAsPng,
    exportAllPagesAsJpg,
    downloadBlob,
    getPdfInfo
} from '../utils/pdfExporter';
import { downloadAsDocx } from '../utils/pdfToDocx';

/**
 * ExportTool - PDF dışa aktarma araçları
 */
export default function ExportTool({ pdfData, currentPage = 1, exportType = 'image' }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [settings, setSettings] = useState({
        scale: 2,
        quality: 0.92,
        format: 'png',
    });

    const handleExportCurrentPage = useCallback(async () => {
        if (!pdfData) {
            setMessage({ type: 'error', text: 'PDF dosyası yükleyin' });
            return;
        }

        setLoading(true);
        try {
            const options = { scale: settings.scale, quality: settings.quality };

            if (settings.format === 'png') {
                await downloadPageAsPng(pdfData, currentPage, 'sayfa', options);
            } else {
                await downloadPageAsJpg(pdfData, currentPage, 'sayfa', options);
            }

            setMessage({ type: 'success', text: `Sayfa ${currentPage} indirildi` });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Dışa aktarma hatası: ' + error.message });
        } finally {
            setLoading(false);
        }
    }, [pdfData, currentPage, settings]);

    const handleExportAllPages = useCallback(async () => {
        if (!pdfData) {
            setMessage({ type: 'error', text: 'PDF dosyası yükleyin' });
            return;
        }

        setLoading(true);
        try {
            const options = { scale: settings.scale, quality: settings.quality };
            const info = await getPdfInfo(pdfData);

            // JSZip ile tüm sayfaları tek ZIP dosyasında topla
            const zip = new JSZip();

            if (settings.format === 'png') {
                const pages = await exportAllPagesAsPng(pdfData, options);
                for (const { pageNum, blob } of pages) {
                    zip.file(`sayfa_${String(pageNum).padStart(3, '0')}.png`, blob);
                }
            } else {
                const pages = await exportAllPagesAsJpg(pdfData, options);
                for (const { pageNum, blob } of pages) {
                    zip.file(`sayfa_${String(pageNum).padStart(3, '0')}.jpg`, blob);
                }
            }

            // ZIP dosyasını oluştur ve indir
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadBlob(zipBlob, `pdf_sayfalar_${info.numPages}_sayfa.zip`);

            setMessage({ type: 'success', text: `${info.numPages} sayfa ZIP olarak indirildi` });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Dışa aktarma hatası: ' + error.message });
        } finally {
            setLoading(false);
        }
    }, [pdfData, settings]);

    const handleExportWord = useCallback(async () => {
        if (!pdfData) {
            setMessage({ type: 'error', text: 'PDF dosyası yükleyin' });
            return;
        }

        setLoading(true);
        try {
            await downloadAsDocx(pdfData, 'dokuman');
            setMessage({ type: 'success', text: 'Word dosyası indirildi' });
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Dönüştürme hatası: ' + error.message });
        } finally {
            setLoading(false);
        }
    }, [pdfData]);

    const isImageExport = exportType === 'image';

    return (
        <div className="space-y-6">
            {/* Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'error'
                            ? 'bg-red-500/20 border border-red-500/30'
                            : 'bg-emerald-500/20 border border-emerald-500/30'
                            }`}
                    >
                        {message.type === 'error'
                            ? <AlertCircle className="w-5 h-5 text-red-400" />
                            : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        <span className={message.type === 'error' ? 'text-red-300' : 'text-emerald-300'}>
                            {message.text}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {isImageExport ? (
                <>
                    {/* Image Export Settings */}
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <Settings className="w-5 h-5 text-purple-400" />
                            <h3 className="text-lg font-semibold text-gray-200">Dışa Aktarma Ayarları</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Format */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Format</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, format: 'png' }))}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${settings.format === 'png'
                                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        PNG
                                    </button>
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, format: 'jpg' }))}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${settings.format === 'jpg'
                                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        JPG
                                    </button>
                                </div>
                            </div>

                            {/* Scale */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Çözünürlük: {settings.scale}x
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="4"
                                    step="0.5"
                                    value={settings.scale}
                                    onChange={(e) => setSettings(s => ({ ...s, scale: parseFloat(e.target.value) }))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>

                            {/* Quality (for JPG) */}
                            {settings.format === 'jpg' && (
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">
                                        Kalite: {Math.round(settings.quality * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1"
                                        step="0.05"
                                        value={settings.quality}
                                        onChange={(e) => setSettings(s => ({ ...s, quality: parseFloat(e.target.value) }))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                </div>
                            )}
                        </div>
                    </GlassCard>

                    {/* Export Actions */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-semibold text-gray-200 mb-4">Dışa Aktar</h3>

                        <div className="flex flex-wrap gap-3">
                            <NeonButton
                                onClick={handleExportCurrentPage}
                                disabled={!pdfData || loading}
                                loading={loading}
                                icon={<FileImage className="w-4 h-4" />}
                            >
                                Mevcut Sayfa ({currentPage})
                            </NeonButton>

                            <NeonButton
                                variant="emerald"
                                onClick={handleExportAllPages}
                                disabled={!pdfData || loading}
                                loading={loading}
                                icon={<Download className="w-4 h-4" />}
                            >
                                Tüm Sayfalar
                            </NeonButton>
                        </div>
                    </GlassCard>
                </>
            ) : (
                /* Word Export */
                <GlassCard className="p-6">
                    <div className="text-center py-8">
                        <FileText className="w-16 h-16 text-purple-400/50 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-200 mb-2">Word'e Dönüştür</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            PDF dosyasındaki metinleri çıkararak düzenlenebilir Word (.docx) formatına dönüştürün.
                        </p>

                        <NeonButton
                            variant="emerald"
                            onClick={handleExportWord}
                            disabled={!pdfData || loading}
                            loading={loading}
                            icon={<Download className="w-4 h-4" />}
                        >
                            Word Olarak İndir
                        </NeonButton>

                        <p className="text-xs text-gray-500 mt-4">
                            Not: Karmaşık düzenler ve görseller tam olarak korunamayabilir.
                        </p>
                    </div>
                </GlassCard>
            )}

            {/* Empty State */}
            {!pdfData && (
                <GlassCard className="p-6 text-center">
                    <Download className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
                    <p className="text-gray-400">
                        Dışa aktarmak için önce bir PDF dosyası yükleyin
                    </p>
                </GlassCard>
            )}
        </div>
    );
}
