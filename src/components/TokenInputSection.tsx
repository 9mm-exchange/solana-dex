// components/TokenInputSection.tsx
import { AlertTriangle } from 'lucide-react';
import TokenInput from './ui/TokenInput';
import { TokenInputSectionProps } from '../types';

const TokenInputSection: React.FC<TokenInputSectionProps> = ({
  label,
  amount,
  token,
  balance,
  usdValue,
  exceedsBalance,
  onChange,
  onSelectToken,
  onMaxClick,
}) => (
  <div className="mb-6">
    <TokenInput
      label={label}
      value={amount}
      onChange={onChange}
      onSelectToken={onSelectToken}
      token={token}
      balance={balance}
      maxButton={!!onMaxClick}
      onMaxClick={onMaxClick}
    />
    
    {amount && token && !exceedsBalance && usdValue && (
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        ≈ ${usdValue.toFixed(2)} USD
      </div>
    )}
    
    {exceedsBalance && (
      <div className="mt-1 text-sm text-red-500 flex items-center gap-1">
        <AlertTriangle size={14} />
        Amount exceeds your balance
      </div>
    )}
  </div>
);

export default TokenInputSection;