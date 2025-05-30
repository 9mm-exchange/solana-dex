// components/notifications/TransactionNotifications.tsx
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import React from 'react';
import { useTransactionNotifications } from '../../context/TransactionContext';

export const TransactionNotifications: React.FC = () => {
  const { notification, hideNotification } = useTransactionNotifications();

  if (!notification) return null;

  const getNotificationStyles = () => {
    switch (notification.status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      default:
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
    }
  };

  const getIcon = () => {
    switch (notification.status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-start p-4 rounded-lg border ${getNotificationStyles()} shadow-lg max-w-md`}>
        <div className="mr-3 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">
            {notification.status === 'success' && 'Transaction Successful'}
            {notification.status === 'error' && 'Transaction Failed'}
            {notification.status === 'processing' && 'Transaction Processing'}
          </h3>
          <p className="text-sm mt-1">{notification.message}</p>
          {notification.txHash && (
            <a 
              href={`https://solscan.io/tx/${notification.txHash}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm mt-2 inline-block font-medium hover:underline"
            >
              View on Solscan
            </a>
          )}
        </div>
        <button 
          onClick={hideNotification}
          className="ml-4 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};