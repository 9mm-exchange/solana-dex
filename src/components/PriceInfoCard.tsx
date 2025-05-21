// components/PriceInfoCard.tsx
import { PriceInfoCardProps } from '../types';

const PriceInfoCard: React.FC<PriceInfoCardProps> = ({
  position,
  withdrawAmount,
  balance,
}) => (
  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
    <div className="text-sm font-medium mb-2">Prices and pool share</div>
    
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">{position.token0.symbol} price:</span>
        <span>1 {position.token0.symbol} = {(position.token1.price! / position.token0.price!).toFixed(6)} {position.token1.symbol}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">{position.token1.symbol} price:</span>
        <span>1 {position.token1.symbol} = {(position.token0.price! / position.token1.price!).toFixed(6)} {position.token0.symbol}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 dark:text-gray-400">Your pool share:</span>
        <span>
          {withdrawAmount && balance
            ? `${((parseFloat(withdrawAmount) / parseFloat(balance)) * 100).toFixed(4)}%`
            : '0%'
          }
        </span>
      </div>
    </div>
  </div>
);

export default PriceInfoCard;