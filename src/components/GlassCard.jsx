import { motion } from 'framer-motion';

/**
 * GlassCard - Glassmorphism card component with optional glow effects
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card içeriği
 * @param {string} props.className - Ek CSS sınıfları
 * @param {boolean} props.hover - Hover efekti aktif mi
 * @param {boolean} props.glow - Animasyonlu glow efekti
 * @param {string} props.glowColor - 'purple' | 'emerald' | 'cyan'
 */
export default function GlassCard({ 
  children, 
  className = '', 
  hover = true,
  glow = false,
  glowColor = 'purple',
  onClick,
  ...props 
}) {
  const glowColors = {
    purple: 'rgba(168, 85, 247, 0.4)',
    emerald: 'rgba(52, 211, 153, 0.4)',
    cyan: 'rgba(34, 211, 238, 0.4)',
  };

  const borderColors = {
    purple: 'rgba(168, 85, 247, 0.3)',
    emerald: 'rgba(52, 211, 153, 0.3)',
    cyan: 'rgba(34, 211, 238, 0.3)',
  };

  return (
    <motion.div
      className={`glass-card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={hover ? { 
        scale: 1.01,
        borderColor: borderColors[glowColor],
        boxShadow: `0 0 30px ${glowColors[glowColor]}`,
      } : undefined}
      onClick={onClick}
      style={{
        animation: glow ? 'glowPulse 3s ease-in-out infinite' : undefined,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
