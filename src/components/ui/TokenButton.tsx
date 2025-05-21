// components/ui/TokenButton.tsx
import { ChevronDown } from 'lucide-react';
import { Token } from '../../types';

interface TokenButtonProps {
  token: Token | null;
  onClick: () => void;
  disabled?: boolean;
}

const TokenButton: React.FC<TokenButtonProps> = ({ token, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-between"
  >
    <span className="flex items-center gap-1.5 truncate">
      {token ? (
        <>
          {token.logoURI && (
            <img 
              src={token.logoURI} 
              alt={token.symbol} 
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
            />
          )}
          <span className="font-medium truncate">{token.symbol}</span>
        </>
      ) : (
        <span className="font-medium truncate">Select token</span>
      )}
    </span>
    <ChevronDown size={16} className="flex-shrink-0" />
  </button>
);

export default TokenButton;