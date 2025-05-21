// components/PoolInfoCard.tsx
import { PoolInfoCardProps } from '../types';

const PoolInfoCard: React.FC<PoolInfoCardProps> = ({
  token0,
  token1,
  amount0,
  amount1,
  totalValueUSD,
  poolExists,
}) => {
  if (!token0 || !token1 || !amount0 || !amount1) return null;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
      <h3 className="text-sm font-medium mb-3">Pool Information</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Pool Share</span>
          <span>0.023%</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Total Value</span>
          <span>${totalValueUSD.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Exchange Rate</span>
          <span>1 {token0.symbol} = {(token0.price! / token1.price!).toFixed(6)} {token1.symbol}</span>
        </div>
        
        {!poolExists && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Initial APR</span>
            <span className="text-green-500">24.5%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PoolInfoCard;