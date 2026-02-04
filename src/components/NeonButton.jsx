import { motion } from 'framer-motion';

/**
 * NeonButton - Neon parlamalı buton bileşeni
 * @param {Object} props
 * @param {React.ReactNode} props.children - Buton içeriği
 * @param {'purple' | 'emerald' | 'ghost'} props.variant - Buton stili
 * @param {string} props.className - Ek CSS sınıfları
 * @param {boolean} props.disabled - Devre dışı durumu
 * @param {React.ReactNode} props.icon - Sol taraftaki ikon
 * @param {boolean} props.loading - Yükleniyor durumu
 */
export default function NeonButton({
    children,
    variant = 'purple',
    className = '',
    disabled = false,
    icon,
    loading = false,
    onClick,
    type = 'button',
    ...props
}) {
    const variants = {
        purple: 'btn-neon-purple',
        emerald: 'btn-neon-emerald',
        ghost: 'btn-neon-ghost',
    };

    return (
        <motion.button
            type={type}
            className={`btn-neon ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={disabled || loading ? undefined : onClick}
            disabled={disabled || loading}
            whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
            whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            {...props}
        >
            <span className="flex items-center justify-center gap-2">
                {loading ? (
                    <motion.span
                        className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                ) : icon ? (
                    <span className="w-5 h-5">{icon}</span>
                ) : null}
                {children}
            </span>
        </motion.button>
    );
}
