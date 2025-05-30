import { Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { PositionData } from '../../types';

interface PositionModalProps {
  positions: PositionData[];
  onSelect: (position: PositionData) => void;
  onClose: () => void;
}

const PositionModal: React.FC<PositionModalProps> = ({ positions, onSelect, onClose }) => {
  console.log("🚀 ~ positions:", positions)
  const menuDropdown = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPositions, setFilteredPools] = useState(positions);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuDropdown.current && !menuDropdown.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuDropdown]);

  // Enhanced search function
  useEffect(() => {
    const query = searchQuery.toLowerCase();

    const filtered = positions.filter((position) => {
      const token0Symbol = position.token0?.symbol?.toLowerCase() || '';
      const token1Symbol = position.token1?.symbol?.toLowerCase() || '';
      const address = position.address?.toLowerCase() || '';
      const token0Name = position.token0?.name?.toLowerCase() || '';
      const token1Name = position.token1?.name?.toLowerCase() || '';

      return (
        token0Symbol.includes(query) ||
        token1Symbol.includes(query) ||
        `${token0Symbol}/${token1Symbol}`.includes(query) ||
        address.includes(query) ||
        token0Name.includes(query) ||
        token1Name.includes(query)
      );
    });

    setFilteredPools(filtered);
  }, [searchQuery, positions]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl relative max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Your Liquidity Positions</h3>
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
            placeholder="Search by token or pair..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
            autoFocus
          />
        </div>
        
        <div className="overflow-y-auto flex-grow space-y-2">
          {filteredPositions.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No liquidity positions found
            </div>
           ) : (
            filteredPositions.map((position, index) => (
              <button
                key={index}
                onClick={() => onSelect(position)}
                className={`w-full p-3 text-left rounded-lg transition-colors border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700`}
              >
                {position.token0 && position.token1 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex -space-x-2 mr-3">
                        <img
                          src={position.token0.image}
                          alt={position.token0.symbol}
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                        />
                        <img
                          src={position.token1.image}
                          alt={position.token1.symbol}
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{position.token0.symbol}/{position.token1.symbol}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {position.token0.amount || '0'} {position.token0.symbol} + {position.token1.amount || '0'} {position.token1.symbol}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{position.liquidity} LP</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">≈ ${position.vol}</div>
                    </div>
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PositionModal;
