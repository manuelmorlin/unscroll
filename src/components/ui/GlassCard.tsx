'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  /** Intensity of the glass effect: light, medium, heavy */
  intensity?: 'light' | 'medium' | 'heavy';
  /** Whether to show hover glow effect */
  glow?: boolean;
  /** Glow color variant */
  glowColor?: 'red' | 'gold' | 'white';
  /** Border radius preset */
  rounded?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /** Padding preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const intensityStyles = {
  light: 'bg-white/[0.02] backdrop-blur-md border-white/[0.04]',
  medium: 'bg-white/[0.04] backdrop-blur-xl border-white/[0.06]',
  heavy: 'bg-zinc-900/70 backdrop-blur-2xl border-white/[0.08]',
};

const glowColors = {
  red: 'hover:shadow-[0_0_40px_rgba(220,38,38,0.15)]',
  gold: 'hover:shadow-[0_0_40px_rgba(251,191,36,0.15)]',
  white: 'hover:shadow-[0_0_40px_rgba(255,255,255,0.08)]',
};

const roundedStyles = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6 md:p-8',
};

/**
 * iOS 26.2 Glass Card
 * Premium frosted glass effect with volumetric shadows
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(({
  children,
  intensity = 'medium',
  glow = false,
  glowColor = 'white',
  rounded = '2xl',
  padding = 'md',
  className = '',
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={`
        ${intensityStyles[intensity]}
        ${roundedStyles[rounded]}
        ${paddingStyles[padding]}
        ${glow ? glowColors[glowColor] : ''}
        border
        shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.02)_inset]
        transition-shadow duration-300
        ${className}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30 
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

GlassCard.displayName = 'GlassCard';

// Static version without animations (for server components or when no animation needed)
export function GlassCardStatic({
  children,
  intensity = 'medium',
  glow = false,
  glowColor = 'white',
  rounded = '2xl',
  padding = 'md',
  className = '',
}: Pick<GlassCardProps, 'children' | 'intensity' | 'glow' | 'glowColor' | 'rounded' | 'padding' | 'className'>) {
  return (
    <div
      className={`
        ${intensityStyles[intensity]}
        ${roundedStyles[rounded]}
        ${paddingStyles[padding]}
        ${glow ? glowColors[glowColor] : ''}
        border
        shadow-[0_20px_40px_-20px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.02)_inset]
        transition-shadow duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
