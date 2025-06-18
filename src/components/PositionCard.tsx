// components/PositionCard.tsx
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PositionCardProps } from '../types';
import Button from './ui/Button';
import Card, { CardBody, CardFooter } from './ui/Card';
import UserContext from '../context/UserContext';

const PositionCard: React.FC<PositionCardProps> = ({ position }) => {
  const navigate = useNavigate();
  const { isLoading } = useContext(UserContext);
  useEffect(() => {
    console.log("🚀 ~ isLoading:", isLoading)
  }, [isLoading])

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="relative">
              <img 
                src={position.token0.img} 
                alt={position.token0.symbol} 
                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/32'; // Fallback image
                }}
              />
              <img 
                src={position.token1.img} 
                alt={position.token1.symbol} 
                className="absolute -bottom-0 -right-4 w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/32'; // Fallback image
                }}
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold">
                {position.token0.symbol}/{position.token1.symbol}
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {position.liquidity}
              </div>
            </div>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-md text-sm font-medium">
            {position.apr}% APR
          </div>
        </div>
      </CardBody>
      <CardFooter className="bg-gray-50 dark:bg-gray-800/50">
        <div className="flex justify-between items-center w-full">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Value</div>
            <div className="font-bold">{position.value}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Earned</div>
            <div className="font-bold text-green-500">{position.earned}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(`/deposit?pool=${position.poolAddress}`)}>
              Deposit 
            </Button>
            <Button size="sm" variant="danger" onClick={() => navigate(`/withdraw?pool=${position.poolAddress}`)}>
              Withdraw
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PositionCard;