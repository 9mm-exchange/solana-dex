// contexts/TransactionContext.tsx
import React, { createContext, useState, useContext } from 'react';

type TransactionStatus = 'processing' | 'success' | 'error' | null;
type TransactionNotification = {
  status: TransactionStatus;
  message: string;
  txHash?: string;
};

type TransactionContextType = {
  notification: TransactionNotification | null;
  showNotification: (status: TransactionStatus, message: string, txHash?: string) => void;
  hideNotification: () => void;
};

const TransactionContext = createContext<TransactionContextType>({
  notification: null,
  showNotification: () => {},
  hideNotification: () => {},
});

export const TransactionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notification, setNotification] = useState<TransactionNotification | null>(null);

  const showNotification = (status: TransactionStatus, message: string, txHash?: string) => {
    setNotification({ status, message, txHash });
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return (
    <TransactionContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionNotifications = () => useContext(TransactionContext);