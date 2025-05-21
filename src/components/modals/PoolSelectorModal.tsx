// components/PoolSelectorModal.tsx
import { X, Search } from 'lucide-react';
import { PoolSelectorModalProps } from '../../types';

const PoolSelectorModal: React.FC<PoolSelectorModalProps> = ({
  show,
  onClose,
  positions,
  selectedPosition,
  onSelect,
  searchQuery,
  onSearchChange,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">All Liquidity Pools</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search pools..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
            autoFocus
          />
        </div>
        
        <div className="overflow-y-auto flex-grow space-y-2">
          {positions.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No pools found matching your search
            </div>
          ) : (
            positions.map(position => (
              <button
                key={position.id}
                onClick={() => onSelect(position)}
                className={`w-full p-3 text-left rounded-lg transition-colors ${
                  selectedPosition?.id === position.id
                    ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-500'
                    : 'border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {position.token0.symbol}/{position.token1.symbol}
                  </div>
                  <div className="text-sm text-green-500">
                    APR: {position.apr}%
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {position.liquidity}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolSelectorModal;