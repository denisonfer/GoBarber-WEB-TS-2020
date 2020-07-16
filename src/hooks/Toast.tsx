import React, { createContext, useCallback, useState, useContext } from 'react';
import { uuid } from 'uuidv4';

import ToastContainer from '../components/ToastContainer';

export interface ToastState {
  id: string;
  type?: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastData {
  addToast(message: Omit<ToastState, 'id'>): void;
  removeToast(id: string): void;
}

const ToastContext = createContext<ToastData>({} as ToastData);

export const ToastProvider: React.FC = ({ children }) => {
  const [messages, setMessages] = useState<ToastState[]>([]);

  const addToast = useCallback(
    ({ type, title, description }: Omit<ToastState, 'id'>) => {
      const id = uuid();

      const toast = {
        id,
        type,
        title,
        description,
      };

      setMessages(oldMessage => [...oldMessage, toast]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setMessages(state => state.filter(message => message.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer messages={messages} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastData {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast precisa de um AuthProvider');
  }

  return context;
}
