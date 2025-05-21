// components/PoolTable.tsx
import { useNavigate } from 'react-router-dom';
import { PoolTableProps } from '../types';
import Button from './ui/Button';

const PoolTable: React.FC<PoolTableProps> = ({ pools }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pool
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Volume (24h)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Volume Change
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Fees (24h)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              APR
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {pools.map((pool, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="relative">
                    <img 
                      src={pool.token0.logoURI} 
                      alt={pool.token0.symbol} 
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
                    />
                    <img 
                      src={pool.token1.logoURI} 
                      alt={pool.token1.symbol} 
                      className="absolute -bottom-0 -right-4 w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" 
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium">
                      {pool.token0.symbol}/{pool.token1.symbol}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {pool.liquidity}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {pool.volume24h}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`font-medium ${
                  parseFloat(pool.volumeChange24h) >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {parseFloat(pool.volumeChange24h) >= 0 ? '+' : ''}{pool.volumeChange24h}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {pool.fee24h}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600 dark:text-purple-400">
                {pool.apr}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button size="sm" onClick={() => navigate(`/deposit?token0=${pool.token0.mint}&token1=${pool.token1.mint}`)}>
                  Deposit Liquidity
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PoolTable;