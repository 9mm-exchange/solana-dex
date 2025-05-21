// components/TokenBreakdownCard.tsx
import { TokenBreakdownCardProps } from '../types';

const TokenBreakdownCard: React.FC<TokenBreakdownCardProps> = ({
  position,
  token0Amount,
  token1Amount,
  token0UsdValue,
  token1UsdValue,
  totalUsdValue,
}) => (
  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
    <div className="text-sm font-medium mb-3">You will receive:</div>
    
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={position.token0.logoURI} 
            alt={position.token0.symbol} 
            className="w-6 h-6 rounded-full mr-2" 
          />
          <span>{position.token0.symbol}</span>
        </div>
        <div className="text-right">
          <div className="font-medium">{token0Amount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">≈ ${token0UsdValue.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={position.token1.logoURI} 
            alt={position.token1.symbol} 
            className="w-6 h-6 rounded-full mr-2" 
          />
          <span>{position.token1.symbol}</span>
        </div>
        <div className="text-right">
          <div className="font-medium">{token1Amount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">≈ ${token1UsdValue.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between font-medium">
        <span>Total:</span>
        <span>≈ ${totalUsdValue.toFixed(2)}</span>
      </div>
    </div>
  </div>
);

export default TokenBreakdownCard;