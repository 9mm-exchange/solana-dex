import { ChevronRight, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { tokens } from '../../data/mockData';
import { Token } from '../../types';

interface TokenSelectorProps {
  onSelect: (token: Token) => void;
  onClose: () => void;
  excludeToken?: Token | null;
  selectedToken?: Token | null;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ 
  onSelect, 
  onClose, 
  excludeToken,
  selectedToken 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const isExcluded = excludeToken && token.id === excludeToken.id;
      
      return matchesSearch && !isExcluded;
    });
  }, [searchQuery, excludeToken]);

  const popularTokens = useMemo(() => {
    return tokens.filter(token => 
      ['SOL', 'USDC', 'RAY', 'JUP'].includes(token.symbol) && 
      (!excludeToken || token.id !== excludeToken.id)
    );
  }, [excludeToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Select Token</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close token selector"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, symbol or address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* Popular Tokens */}
        {searchQuery === '' && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Popular Tokens</h4>
            <div className="flex flex-wrap gap-2">
              {popularTokens.map(token => (
                <button
                  key={token.id}
                  onClick={() => onSelect(token)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    selectedToken?.id === token.id
                      ? 'bg-purple-100 dark:bg-purple-900/30'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } transition-colors`}
                >

                  <img 
                        src={token.logoURI} 
                        alt={token.symbol} 
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800" 
                      />
                  <span className="font-medium">{token.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token List */}
        <div className="overflow-y-auto flex-grow -mx-2 px-2">
          {filteredTokens.length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <Search size={40} className="mx-auto mb-2 text-gray-300" />
              <p>No tokens found</p>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTokens.map(token => (
                <button
                  key={token.id}
                  onClick={() => onSelect(token)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    selectedToken?.id === token.id ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                  }`}
                >
                  <img 
                        src={token.logoURI} 
                        alt={token.symbol} 
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
                      />
                  <div className="text-left flex-grow">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{token.name}</div>
                  </div>
                  <div className="flex items-center">
                    {token.balance && (
                      <div className="text-right mr-3">
                        <div className="font-medium">{token.balance}</div>
                        {token.price && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ${(parseFloat(token.balance) * token.price).toFixed(2)}
                          </div>
                        )}
                      </div>
                    )}
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default TokenSelector;