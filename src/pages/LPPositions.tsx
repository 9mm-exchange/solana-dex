// components/LPPositions.tsx
import { Plus, TrendingUp, ArrowLeftRight } from 'lucide-react';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EducationalSection from '../components/EducationalSection';
import EmptyState from '../components/EmptyState';
import PoolStatsCard from '../components/PoolStatsCard';
import PoolTableNew from '../components/PoolTableNew';
import PositionCard from '../components/PositionCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { PoolData, TokenData } from '../types';
import { useWallet } from '@solana/wallet-adapter-react';
import UserContext from '../context/UserContext';
import { Spinner } from '../components/Spinner';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPositions } from '../store/slices/positionSlice';
import { RootState, AppDispatch } from '../store';

const LPPositions: React.FC = () => {
  const { isLoading, setIsLoading } = useContext(UserContext);
  const wallet = useWallet();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<'top' | 'my'>('top');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('day');
  
  const { positions, loading: positionsLoading } = useSelector((state: RootState) => state.positions);

  // Fetch positions on component mount
  useEffect(() => {
    if (wallet) {
      dispatch(fetchPositions(wallet));
    }
  }, [dispatch, wallet]);

  // Calculate totals
  const totalValue = positions.reduce((sum, pool) => {
    const valueNumber = parseFloat(pool.liquidity || '0');
    return sum + valueNumber;
  }, 0);

  const totalEarned = positions.reduce((sum, pool) => {
    const earnedNumber = parseFloat(pool.vol || '0');
    return sum + earnedNumber;
  }, 0);

  const averageAPR = positions.length > 0
    ? (positions.reduce((sum, pool) => {
        const volume = parseFloat(pool.vol || '0');
        const liquidity = parseFloat(pool.liquidity || '0');
        const apr = liquidity > 0 ? (volume / liquidity) * 100 : 0;
        return sum + apr;
      }, 0) / positions.length).toFixed(2)
    : '0.00';

  return (
    <div>
      {(isLoading || positionsLoading) && <Spinner />}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">LP Positions</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/create-lp')} disabled={isLoading || positionsLoading}>
            <Plus size={16} className="mr-1" /> Create New LP
          </Button>
        </div>
      </div>

      {/* Stats Cards - Only show for "My Positions" tab */}
      {activeTab === 'my' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <PoolStatsCard
            title="Total Value Locked"
            value={`$${totalValue.toLocaleString()}`}
            gradient="from-purple-500 to-purple-700"
            icon={<TrendingUp size={20} className="text-white" />}
          />
          <PoolStatsCard
            title="Total Fees"
            value={`$${totalEarned.toLocaleString()}`}
            gradient="from-pink-500 to-pink-700"
            icon={<TrendingUp size={20} className="text-white" />}
          />
          <PoolStatsCard
            title="Average APR"
            value={`${averageAPR}%`}
            gradient="from-teal-500 to-teal-700"
            icon={<TrendingUp size={20} className="text-white" />}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('top')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'top'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          Top Pools
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'my'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
          My Positions
        </button>
      </div>

      {/* Timeframe Filter - Only show for "Top Pools" tab */}
      {activeTab === 'top' && (
        <div className="flex gap-2 mb-6">
          {['day', 'week', 'month', 'all'].map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${timeframe === period
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
            >
              {period === 'day' ? '24h' : period === 'week' ? '7d' : period === 'month' ? '30d' : 'All time'}
            </button>
          ))}
        </div>
      )}

      {/* Content based on active tab */}
      <div className="space-y-4">
        {activeTab === 'top' ? (
          <Card>
            <PoolTableNew />
          </Card>
        ) : (
          <>
            {positions.length > 0 ? (
              positions
                .filter(pool => parseFloat(pool.liquidity || '0') > 0)
                .map((pool, index) => {
                  const token0Data: TokenData = pool.token0 ? {
                    id: pool.token0.symbol,
                    text: pool.token0.name,
                    img: pool.token0.image,
                    address: pool.token0.address,
                    name: pool.token0.name,
                    symbol: pool.token0.symbol
                  } : {
                    id: '',
                    text: '',
                    img: '',
                    address: '',
                    name: '',
                    symbol: ''
                  };

                  const token1Data: TokenData = pool.token1 ? {
                    id: pool.token1.symbol,
                    text: pool.token1.name,
                    img: pool.token1.image,
                    address: pool.token1.address,
                    name: pool.token1.name,
                    symbol: pool.token1.symbol
                  } : {
                    id: '',
                    text: '',
                    img: '',
                    address: '',
                    name: '',
                    symbol: ''
                  };

                  return (
                    <PositionCard 
                      key={index} 
                      position={{
                        poolAddress: pool.address,
                        token0: token0Data,
                        token1: token1Data,
                        liquidity: pool.liquidity,
                        apr: parseFloat(averageAPR),
                        value: pool.liquidity,
                        earned: pool.userEarned
                      }} 
                    />
                  );
                })
            ) : (
              <EmptyState
                title="No LP Positions Yet"
                description="Start earning by providing liquidity to token pairs."
                buttonText="Create New LP"
                onButtonClick={() => navigate('/create-lp')}
              />
            )}
          </>
        )}
      </div>

      <EducationalSection />
    </div>
  );
};

export default LPPositions;