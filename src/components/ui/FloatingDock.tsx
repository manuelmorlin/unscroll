'use client';

import { motion } from 'framer-motion';

type TabItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  emoji?: string;
};

interface FloatingDockProps {
  items: TabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * iOS 26.2 Floating Dock Navigation
 * A floating bottom navigation that feels like a liquid glass island
 */
export function FloatingDock({ items, activeId, onSelect, className = '' }: FloatingDockProps) {
  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        floating-dock rounded-2xl
        px-2 py-2
        safe-bottom
        ${className}
      `}
    >
      <div className="flex items-center gap-1">
        {items.map((item) => {
          const isActive = item.id === activeId;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`
                relative flex items-center justify-center gap-2
                px-4 py-3 rounded-xl
                transition-colors duration-200
                min-w-[56px]
                ${isActive 
                  ? 'text-amber-400' 
                  : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  layoutId="dock-active"
                  className="absolute inset-0 bg-amber-400/10 rounded-xl border border-amber-400/20"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Icon or Emoji */}
              <span className="relative z-10 text-xl">
                {item.emoji || item.icon}
              </span>
              
              {/* Label - only show on larger screens or for active item */}
              <span className={`
                relative z-10 text-sm font-medium
                hidden sm:block
                ${isActive ? 'text-amber-400' : ''}
              `}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

/**
 * Minimal floating dock variant - icons only
 * Optimized for iPhone 17 with ultra-compact mobile design
 */
export function FloatingDockMinimal({ items, activeId, onSelect, className = '' }: FloatingDockProps) {
  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`
        fixed -bottom-1 sm:bottom-4 left-1/2 -translate-x-1/2 z-50
        floating-dock rounded-full
        p-0 sm:px-3 sm:py-3
        safe-bottom
        ${className}
      `}
    >
      <div className="flex items-center">
        {items.map((item) => {
          const isActive = item.id === activeId;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`
                relative flex items-center justify-center
                w-10 h-10 sm:w-12 sm:h-12
                transition-colors duration-200
                ${isActive 
                  ? 'text-amber-400' 
                  : 'text-zinc-500 hover:text-zinc-300 active:text-zinc-200'
                }
              `}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="dock-active-minimal"
                  className="absolute inset-1 bg-amber-400/15 rounded-full"
                  style={{
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              <span className="relative z-10 text-lg sm:text-2xl">
                {item.emoji || item.icon}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}
