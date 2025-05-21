// components/PoolSelectorButton.tsx
import { ChevronDown } from 'lucide-react';
import { PoolSelectorButtonProps } from '../types';


const PoolSelectorButton: React.FC<PoolSelectorButtonProps> = ({
  position,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {position ? 'Selected Pool' : 'Select Pool'}
        </div>
        <div className="font-medium">
          {position
            ? `${position.token0.symbol}/${position.token1.symbol}`
            : 'View all pools'}
        </div>
      </div>
      <ChevronDown size={16} className="text-gray-400" />
    </div>
    {position && (
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        APR: {position.apr}%
      </div>
    )}
  </button>
);

export default PoolSelectorButton;