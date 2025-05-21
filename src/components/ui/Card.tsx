import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', glass = false }) => {
  const baseClasses = 'rounded-2xl shadow-lg overflow-hidden';
  
  const glassClasses = glass 
    ? 'backdrop-blur-md bg-white/10 dark:bg-gray-900/30 border border-white/20 dark:border-gray-800/50' 
    : 'bg-white dark:bg-gray-800';
  
  return (
    <div className={`${baseClasses} ${glassClasses} ${className}`}>
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-5 border-b border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-5 ${className}`}>
      {children}
    </div>
  );
};

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`p-5 border-t border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

export default Card;