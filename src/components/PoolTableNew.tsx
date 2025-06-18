// components/PoolTable.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransformedPool } from '../types';
import { getPoolList } from '../utils/getPoolList';
import Button from './ui/Button';
import { ArrowLeftRight } from 'lucide-react';

const PoolTableNew = () => {
  const navigate = useNavigate();
  const [fetchedPools, setFetchedPools] = useState<TransformedPool[]>([]);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const rawPools = await getPoolList();
        console.log("🚀 ~ fetchPools ~ rawPools:", rawPools)
        const poolList: TransformedPool[] = rawPools
          .filter((pool: any) => pool.token0 && pool.token1)
          .map((pool: any) => ({
            token0: {
              symbol: pool.token0.symbol,
              logoURI: pool.token0.image,
              mint: pool.token0.address,
            },
            token1: {
              symbol: pool.token1.symbol,
              logoURI: pool.token1.image,
              mint: pool.token1.address,
            },
            liquidity: pool.liquidity || '0',
            volume24h: pool.vol || '0',
            volumeChange24h: '0',
            fee24h: '0',
            apr: '0',
            poolAddress: pool.address,
          }));


        setFetchedPools(poolList);
      } catch (error) {
        console.error("Error fetching pools:", error);
      }
    };

    fetchPools();
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Pool
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Volume (24h)
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Volume Change
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Fees (24h)
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              APR
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {fetchedPools.map((pool, index) => (
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
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                {pool.volume24h}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                <span className={`font-medium ${parseFloat(pool.volumeChange24h) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                  {parseFloat(pool.volumeChange24h) >= 0 ? '+' : ''}{pool.volumeChange24h}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                {pool.fee24h}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-purple-600 dark:text-purple-400">
                {pool.apr}%
              </td>
              <td className="flex gap-2 px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <Button size="sm" onClick={() => navigate(`/deposit?pool=${pool.poolAddress}`)}>
                  Deposit Liquidity
                </Button>
                <Button onClick={() => navigate(`/swap?pooladdress=${pool.poolAddress}`)}>
                  Swap
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PoolTableNew;