// components/TokenInput.tsx
import React from 'react';
import {TokenInputProps } from '../../types';
import TokenButton from './TokenButton';
import MaxButton from './MaxButton';
import BalanceLabel from './BalanceLabel';


const TokenInput: React.FC<TokenInputProps> = ({
  value,
  onChange,
  onSelectToken,
  token,
  label,
  placeholder = '0.0',
  balance,
  maxButton = false,
  onMaxClick,
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const inputValue = e.target.value;
    // Only allow numbers and a single decimal point
    if (!/^\d*\.?\d*$/.test(inputValue)) return;
    
    onChange(inputValue);
  };

  const handleMaxClick = () => {
    if (!disabled && onMaxClick) {
      onMaxClick();
    }
  };

  return (
    <div className="w-full">
      {(label || balance) && (
        <div className="flex justify-between text-sm mb-2">
          {label && (
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
          )}
          <BalanceLabel balance={balance} />
        </div>
      )}

      <div
        className={`flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-grow bg-transparent border-none outline-none text-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 disabled:cursor-not-allowed min-w-0 w-[50%]"
          inputMode="decimal"
          pattern="^[0-9]*[.,]?[0-9]*$"
        />

        <div className="flex items-center gap-2 ml-2">
          {maxButton && (
            <MaxButton 
              onClick={handleMaxClick} 
              disabled={disabled} 
            />
          )}

          <TokenButton 
            token={token} 
            onClick={onSelectToken} 
            disabled={disabled} 
          />
        </div>
      </div>
    </div>
  );
};

export default TokenInput;