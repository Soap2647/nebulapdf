import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

/**
 * FileDropzone - Sürükle-bırak dosya yükleme bileşeni
 * @param {Object} props
 * @param {Function} props.onFileSelect - Dosya seçildiğinde çağrılır
 * @param {string} props.accept - Kabul edilen dosya türleri
 */
export default function FileDropzone({
    onFileSelect,
    accept = '.pdf',
    maxSize = 50 * 1024 * 1024, // 50MB
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState(null);

    const validateFile = (file) => {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return 'Sadece PDF dosyaları kabul edilir';
        }
        if (file.size > maxSize) {
            return `Dosya boyutu ${(maxSize / 1024 / 1024).toFixed(0)}MB'dan küçük olmalı`;
        }
        return null;
    };

    const handleFile = useCallback((file) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setTimeout(() => setError(null), 3000);
            return;
        }

        setFile(file);
        setError(null);
        onFileSelect?.(file);
    }, [onFileSelect, maxSize]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [handleFile]);

    const handleInputChange = useCallback((e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    }, [handleFile]);

    const removeFile = useCallback(() => {
        setFile(null);
        onFileSelect?.(null);
    }, [onFileSelect]);

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {!file ? (
                    <motion.label
                        key="dropzone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`dropzone ${isDragging ? 'active' : ''} block`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept={accept}
                            onChange={handleInputChange}
                            className="hidden"
                        />

                        <motion.div
                            animate={isDragging ? { scale: 1.05, y: -5 } : { scale: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <motion.div
                                className={`p-4 rounded-full ${isDragging ? 'bg-emerald-500/20' : 'bg-purple-500/20'}`}
                                animate={isDragging ? {
                                    boxShadow: '0 0 30px rgba(52, 211, 153, 0.4)'
                                } : {
                                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
                                }}
                            >
                                <Upload
                                    className={`w-10 h-10 ${isDragging ? 'text-emerald-400' : 'text-purple-400'}`}
                                />
                            </motion.div>

                            <div className="space-y-2">
                                <p className="text-lg font-medium text-gray-200">
                                    {isDragging ? 'Dosyayı bırakın' : 'PDF dosyasını sürükleyin'}
                                </p>
                                <p className="text-sm text-gray-400">
                                    veya <span className="text-purple-400 hover:text-purple-300 cursor-pointer">dosya seçin</span>
                                </p>
                            </div>

                            <p className="text-xs text-gray-500">
                                Maksimum dosya boyutu: {(maxSize / 1024 / 1024).toFixed(0)}MB
                            </p>
                        </motion.div>
                    </motion.label>
                ) : (
                    <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <FileText className="w-8 h-8 text-purple-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-200 truncate max-w-xs">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="text-emerald-400"
                                >
                                    <CheckCircle className="w-6 h-6" />
                                </motion.div>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={removeFile}
                                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400 hover:text-red-400" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
                    >
                        <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
