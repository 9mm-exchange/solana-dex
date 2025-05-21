import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, className = '' }) => {
  return (
    <div className={`flex items-center gap-2 text-red-500 text-sm ${className}`}>
      <AlertTriangle size={16} />
      <span>{message}</span>
    </div>
  );
};

export default ErrorMessage;