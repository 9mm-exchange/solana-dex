import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  // Base classes always applied
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 focus:outline-none flex items-center justify-center';
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3'
  };
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 disabled:bg-purple-400',
    secondary: 'bg-teal-500 text-white hover:bg-teal-600 active:bg-teal-700 disabled:bg-teal-300',
    outline: 'border-2 border-purple-600 text-purple-600 hover:bg-purple-50 active:bg-purple-100 dark:hover:bg-purple-900/30 dark:active:bg-purple-900/50 disabled:border-purple-300 disabled:text-purple-300',
    ghost: 'text-purple-600 hover:bg-purple-50 active:bg-purple-100 dark:hover:bg-purple-900/30 dark:active:bg-purple-900/50 disabled:text-purple-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-300'
  };
  
  // Full width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Disabled class
  const disabledClass = disabled ? 'cursor-not-allowed opacity-70' : '';
  
  return (
    <button
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;