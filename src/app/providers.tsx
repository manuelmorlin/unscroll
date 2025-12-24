'use client';

import { type ReactNode } from 'react';
import { ToastProvider, ConfirmProvider, ModalProvider } from '@/components/ui';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
