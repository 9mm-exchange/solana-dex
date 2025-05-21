// components/PositionInputSection.tsx
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { PositionInputSectionProps } from '../types';


const PositionInputSection: React.FC<PositionInputSectionProps> = ({
  selectedPosition,
  onSelect,
  withdrawAmount,
  onAmountChange,
  onMaxClick,
  exceedsBalance,
}) => (
  <>
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select a liquidity position</label>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {selectedPosition ? `Balance: ${selectedPosition.balance}` : ''}
        </span>
      </div>
      
      <button
        onClick={onSelect}
        className={`w-full p-4 rounded-xl border-2 ${selectedPosition ? 'border-gray-200 dark:border-gray-700' : 'border-purple-500'} bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
      >
        {selectedPosition ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                <img 
                  src={selectedPosition.token0.logoURI} 
                  alt={selectedPosition.token0.symbol} 
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
                />
                <img 
                  src={selectedPosition.token1.logoURI} 
                  alt={selectedPosition.token1.symbol} 
                  className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
                />
              </div>
              <div className="ml-3 text-left">
                <div className="font-medium">
                  {selectedPosition.token0.symbol}/{selectedPosition.token1.symbol}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedPosition.token0Amount} {selectedPosition.token0.symbol} + {selectedPosition.token1Amount} {selectedPosition.token1.symbol}
                </div>
              </div>
            </div>
            <ChevronDown size={20} className="text-gray-500" />
          </div>
        ) : (
          <div className="text-center text-purple-600 dark:text-purple-400 font-medium">
            Select a position
          </div>
        )}
      </button>
    </div>
    
    {selectedPosition && (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
          <button 
            onClick={onMaxClick}
            className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-purple-600 dark:text-purple-400 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            MAX
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={withdrawAmount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.0"
            className="w-full p-4 pr-20 text-xl rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-purple-500"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
            LP
          </div>
        </div>
        
        {exceedsBalance && (
          <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <AlertTriangle size={14} />
            Insufficient LP balance
          </div>
        )}
      </div>
    )}
  </>
);

export default PositionInputSection;