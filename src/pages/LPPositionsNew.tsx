// components/LPPositions.tsx
import { Plus, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EducationalSection from '../components/EducationalSection';
import EmptyState from '../components/EmptyState';
import PoolStatsCard from '../components/PoolStatsCard';
import PoolTableNew from '../components/PoolTableNew';
import PositionCard from '../components/PositionCard';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { myPositions } from '../data/mockData';

const LPPositionsNew: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'top' | 'my'>('top');
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'all'>('day');
  
  // Calculate totals
  const totalValue = myPositions.reduce((sum, position) => {
    const valueNumber = parseFloat(position.value.replace('$', '').replace(',', ''));
    return sum + valueNumber;
  }, 0);
  
  const totalEarned = myPositions.reduce((sum, position) => {
    const earnedNumber = parseFloat(position.earned.replace('$', '').replace(',', ''));
    return sum + earnedNumber;
  }, 0);

  const averageAPR = myPositions.length > 0 
    ? (myPositions.reduce((sum, pos) => sum + pos.apr, 0) / myPositions.length).toFixed(2)
    : '0.00';

   

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">LP Positions</h1>
        <Button onClick={() => navigate('/create-lp-new')}>
          <Plus size={16} className="mr-1" /> Create New LP
        </Button>
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
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'top'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Top Pools
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'my'
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
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeframe === period
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
            {myPositions.length > 0 ? (
              myPositions.map((position, index) => (
                <PositionCard key={index} position={position} />
              ))
            ) : (
              <EmptyState
                title="No LP Positions Yet"
                description="Start earning by providing liquidity to token pairs."
                buttonText="Create New LP"
                onButtonClick={() => navigate('/create-lp-new')}
              />
            )}
          </>
        )}
      </div>
      
      <EducationalSection />
    </div>
  );
};

export default LPPositionsNew;