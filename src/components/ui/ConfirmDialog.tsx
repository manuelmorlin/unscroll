'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolvePromise?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolvePromise?.(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      
      {/* Confirm Dialog */}
      <AnimatePresence>
        {isOpen && options && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110]"
            />
            
            {/* Dialog */}
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pointer-events-auto w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
              >
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    options.danger 
                      ? 'bg-red-500/20 border border-red-500/30' 
                      : 'bg-yellow-500/20 border border-yellow-500/30'
                  }`}>
                    <AlertTriangle className={`w-7 h-7 ${options.danger ? 'text-red-400' : 'text-yellow-400'}`} />
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  {options.title}
                </h3>
                <p className="text-sm text-zinc-400 text-center mb-6">
                  {options.message}
                </p>
                
                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                  >
                    {options.cancelText || 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirm}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                      options.danger
                        ? 'text-white bg-red-600 hover:bg-red-500'
                        : 'text-black bg-yellow-500 hover:bg-yellow-400'
                    }`}
                  >
                    {options.confirmText || 'Confirm'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
