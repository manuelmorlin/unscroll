'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ModalContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalCount, setModalCount] = useState(0);

  const openModal = useCallback(() => {
    setModalCount(prev => prev + 1);
  }, []);

  const closeModal = useCallback(() => {
    setModalCount(prev => Math.max(0, prev - 1));
  }, []);

  return (
    <ModalContext.Provider value={{ isModalOpen: modalCount > 0, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
