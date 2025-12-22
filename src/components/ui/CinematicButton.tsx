'use client';

import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CinematicButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Whether to show glow effect */
  glow?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Icon to show before text */
  icon?: React.ReactNode;
  /** Icon to show after text */
  iconAfter?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-b from-red-500 to-red-700
    border border-red-500/30
    text-white font-semibold
    shadow-[0_0_20px_rgba(220,38,38,0.3),0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
    hover:shadow-[0_0_30px_rgba(220,38,38,0.4),0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]
    hover:from-red-400 hover:to-red-600
  `,
  secondary: `
    bg-gradient-to-b from-amber-400 to-amber-600
    border border-amber-400/30
    text-black font-semibold
    shadow-[0_0_20px_rgba(251,191,36,0.2),0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]
    hover:shadow-[0_0_30px_rgba(251,191,36,0.3),0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]
    hover:from-amber-300 hover:to-amber-500
  `,
  ghost: `
    bg-white/[0.03]
    border border-white/[0.06]
    text-zinc-300 font-medium
    hover:bg-white/[0.06]
    hover:border-white/[0.1]
    hover:text-white
    backdrop-blur-sm
  `,
  danger: `
    bg-gradient-to-b from-red-600 to-red-800
    border border-red-600/30
    text-white font-semibold
    shadow-[0_4px_16px_rgba(0,0,0,0.4)]
    hover:from-red-500 hover:to-red-700
  `,
  success: `
    bg-gradient-to-b from-emerald-500 to-emerald-700
    border border-emerald-500/30
    text-white font-semibold
    shadow-[0_0_20px_rgba(16,185,129,0.2),0_4px_16px_rgba(0,0,0,0.4)]
    hover:shadow-[0_0_30px_rgba(16,185,129,0.3),0_8px_24px_rgba(0,0,0,0.5)]
    hover:from-emerald-400 hover:to-emerald-600
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-3 text-base rounded-xl gap-2',
  lg: 'px-7 py-4 text-lg rounded-2xl gap-2.5',
};

/**
 * iOS 26.2 Cinematic Button
 * Premium button with haptic feedback simulation and volumetric lighting
 */
export const CinematicButton = forwardRef<HTMLButtonElement, CinematicButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  glow = true,
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconAfter,
  className = '',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      className={`
        inline-flex items-center justify-center
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${glow && !isDisabled && variant === 'primary' ? 'shadow-[0_0_25px_rgba(220,38,38,0.3)]' : ''}
        ${glow && !isDisabled && variant === 'secondary' ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}
        transition-all duration-200
        ${className}
      `}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.97 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      {...props}
    >
      {loading ? (
        <motion.span
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
          {iconAfter && <span className="flex-shrink-0">{iconAfter}</span>}
        </>
      )}
    </motion.button>
  );
});

CinematicButton.displayName = 'CinematicButton';

/**
 * Icon-only button variant
 */
interface IconButtonProps extends Omit<CinematicButtonProps, 'children' | 'icon' | 'iconAfter'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}, ref) => {
  const iconSizes = {
    sm: 'w-9 h-9 p-0',
    md: 'w-11 h-11 p-0',
    lg: 'w-14 h-14 p-0',
  };

  return (
    <CinematicButton
      ref={ref}
      variant={variant}
      size={size}
      className={`${iconSizes[size]} ${className}`}
      {...props}
    >
      {icon}
    </CinematicButton>
  );
});

IconButton.displayName = 'IconButton';
