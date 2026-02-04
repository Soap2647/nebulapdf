import { motion } from 'framer-motion';
import {
    FileText,
    Image,
    Type,
    FileImage,
    FileType,
    Sparkles
} from 'lucide-react';

/**
 * Sidebar - Minimal icon-only navigation
 */
export default function Sidebar({ activeTab, onTabChange }) {
    const menuItems = [
        {
            id: 'view',
            label: 'PDF Görüntüle',
            icon: FileText,
            color: 'purple',
        },
        {
            id: 'remove-images',
            label: 'Görsel Sil',
            icon: Image,
            color: 'pink',
        },
        {
            id: 'edit-text',
            label: 'Metin Düzenle',
            icon: Type,
            color: 'cyan',
        },
        {
            id: 'export-image',
            label: 'PNG/JPG Çıkar',
            icon: FileImage,
            color: 'emerald',
        },
        {
            id: 'export-word',
            label: "Word'e Dönüştür",
            icon: FileType,
            color: 'orange',
        },
    ];

    const colorClasses = {
        purple: {
            bg: 'bg-purple-500/20',
            text: 'text-purple-400',
            border: 'border-purple-500/50',
        },
        pink: {
            bg: 'bg-pink-500/20',
            text: 'text-pink-400',
            border: 'border-pink-500/50',
        },
        cyan: {
            bg: 'bg-cyan-500/20',
            text: 'text-cyan-400',
            border: 'border-cyan-500/50',
        },
        emerald: {
            bg: 'bg-emerald-500/20',
            text: 'text-emerald-400',
            border: 'border-emerald-500/50',
        },
        orange: {
            bg: 'bg-orange-500/20',
            text: 'text-orange-400',
            border: 'border-orange-500/50',
        },
    };

    return (
        <aside className="w-24 h-full glass-card flex flex-col items-center">
            {/* Logo */}
            <div className="py-8 border-b border-purple-500/20 w-full flex justify-center">
                <motion.div
                    className="p-3 bg-purple-500/20 rounded-2xl"
                    animate={{
                        boxShadow: [
                            '0 0 20px rgba(168, 85, 247, 0.3)',
                            '0 0 40px rgba(168, 85, 247, 0.5)',
                            '0 0 20px rgba(168, 85, 247, 0.3)',
                        ]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <Sparkles className="w-8 h-8 text-purple-400" />
                </motion.div>
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 py-8 space-y-3 w-full px-3">
                {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const colors = colorClasses[item.color];

                    return (
                        <div key={item.id} className="relative group">
                            <motion.button
                                onClick={() => onTabChange(item.id)}
                                className={`w-full aspect-square flex items-center justify-center rounded-2xl transition-all duration-300 ${isActive
                                        ? `${colors.bg} ${colors.text} border-2 ${colors.border}`
                                        : 'hover:bg-white/5 text-gray-400 hover:text-gray-200 border-2 border-transparent'
                                    }`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                title={item.label}
                            >
                                <Icon className="w-7 h-7" />
                            </motion.button>

                            {/* Tooltip on hover */}
                            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                                {item.label}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer  */}
            <div className="py-6 w-full flex justify-center">
                <div className="text-center">
                    <div className="status-dot online mx-auto mb-2"></div>
                    <p className="text-xs text-emerald-500/70 font-medium">100%</p>
                    <p className="text-[10px] text-gray-600">Güvenli</p>
                </div>
            </div>
        </aside>
    );
}
