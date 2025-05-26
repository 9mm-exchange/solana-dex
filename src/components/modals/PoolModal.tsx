import { Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { PoolData } from '../../types';

interface PoolModalProps {
  pools: PoolData[];
  onSelect: (pool: PoolData) => void;
  onClose: () => void;
}

const PoolModal: React.FC<PoolModalProps> = ({ pools, onSelect, onClose }) => {
  console.log("🚀 ~ pools:", pools)
  const menuDropdown = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPools, setFilteredPools] = useState(pools);

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

    const filtered = pools.filter((pool) => {
      const quoteSymbol = pool.token0?.symbol?.toLowerCase() || '';
      const baseSymbol = pool.token1?.symbol?.toLowerCase() || '';
      const address = pool.address?.toLowerCase() || '';
      const quoteName = pool.token0?.name?.toLowerCase() || '';
      const baseName = pool.token1?.name?.toLowerCase() || '';

      return (
        quoteSymbol.includes(query) ||
        baseSymbol.includes(query) ||
        `${quoteSymbol}/${baseSymbol}`.includes(query) ||
        address.includes(query) ||
        quoteName.includes(query) ||
        baseName.includes(query)
      );
    });

    setFilteredPools(filtered);
  }, [searchQuery, pools]);

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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto flex-grow space-y-2">
          {filteredPools.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No pools found matching your search
            </div>
          ) : (
            filteredPools.map((pool, index) => (
              <button
                key={index}
                onClick={() => onSelect(pool)}
                className={`w-full p-3 text-left rounded-lg transition-colors border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700`}
              >
                {pool.token0 && pool.token1 && (
                  <div className="flex items-center justify-between">
                    <div className="font-medium flex items-center gap-2">
                      <div className="flex -space-x-2 mr-3">
                        <img
                          src={pool.token0.image}
                          alt={pool.token0.symbol}
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                        />
                        <img
                          src={pool.token1.image}
                          alt={pool.token1.symbol}
                          className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                        />
                      </div>
                      {pool.token0.symbol}/{pool.token1.symbol}
                    </div>
                    <div className="text-sm text-green-500">
                      APR: {pool.vol}%
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {pool.liquidity}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolModal;
