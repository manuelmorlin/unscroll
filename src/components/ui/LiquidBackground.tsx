'use client';

import { motion } from 'framer-motion';

interface LiquidBackgroundProps {
  children: React.ReactNode;
  className?: string;
  /** Optional accent color from poster - will create ambient glow */
  accentColor?: string;
  /** Whether to animate the gradient */
  animated?: boolean;
}

/**
 * iOS 26.2 Liquid Background
 * Creates an immersive, flowing gradient background with optional accent color extraction
 */
export function LiquidBackground({ 
  children, 
  className = '', 
  accentColor,
  animated = true 
}: LiquidBackgroundProps) {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Base gradient layer */}
      <div 
        className={`fixed inset-0 ${animated ? 'liquid-animated' : 'liquid-bg'}`}
        style={{
          background: accentColor 
            ? `
                radial-gradient(ellipse at 20% 30%, ${accentColor}20 0%, transparent 50%),
                radial-gradient(ellipse at 80% 70%, rgba(251, 191, 36, 0.06) 0%, transparent 50%),
                linear-gradient(180deg, #050506 0%, #0a0a0c 100%)
              `
            : undefined
        }}
      />
      
      {/* Animated orbs for depth */}
      {animated && (
        <>
          <motion.div
            className="fixed w-[600px] h-[600px] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${accentColor || 'rgba(220, 38, 38, 0.08)'} 0%, transparent 70%)`,
              filter: 'blur(60px)',
              top: '10%',
              left: '-10%',
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="fixed w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.05) 0%, transparent 70%)',
              filter: 'blur(60px)',
              bottom: '10%',
              right: '-10%',
            }}
            animate={{
              x: [0, -30, 0],
              y: [0, -40, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
