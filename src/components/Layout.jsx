import { motion } from 'framer-motion';
import Sidebar from './Sidebar';

/**
 * Layout - Ana uygulama iskelet yapısı
 * @param {Object} props
 * @param {React.ReactNode} props.children - İçerik
 * @param {string} props.activeTab - Aktif sekme
 * @param {Function} props.onTabChange - Sekme değişikliği
 */
export default function Layout({ children, activeTab, onTabChange }) {
    return (
        <div className="flex h-screen w-full overflow-hidden grid-pattern">
            {/* Sidebar */}
            <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex-shrink-0"
            >
                <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
            </motion.div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <motion.header
                    className="h-16 glass flex items-center justify-between px-6 m-4 mb-0"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-200">
                            {getTabTitle(activeTab)}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <StatusIndicator />
                    </div>
                </motion.header>

                {/* Content Area */}
                <motion.div
                    className="flex-1 p-4 overflow-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}

function getTabTitle(tab) {
    const titles = {
        'view': 'PDF Görüntüleyici',
        'remove-images': 'Görsel Silme Aracı',
        'edit-text': 'Metin Düzenleme',
        'export-image': 'PNG/JPG Dışa Aktarma',
        'export-word': 'Word Dönüştürücü',
    };
    return titles[tab] || 'Project Nebula';
}

function StatusIndicator() {
    return (
        <motion.div
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full"
            animate={{
                boxShadow: [
                    '0 0 10px rgba(52, 211, 153, 0.2)',
                    '0 0 20px rgba(52, 211, 153, 0.4)',
                    '0 0 10px rgba(52, 211, 153, 0.2)',
                ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
        >
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-xs text-emerald-400 font-medium">Yerel Mod</span>
        </motion.div>
    );
}
