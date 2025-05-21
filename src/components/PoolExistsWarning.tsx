// components/PoolExistsWarning.tsx
import { AlertTriangle } from 'lucide-react';
import { PoolExistsWarningProps } from '../types';

const PoolExistsWarning: React.FC<PoolExistsWarningProps> = ({
  token0,
  token1,
  onNavigate,
}) => (
  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg mb-4">
    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
    <p className="text-sm">
      A liquidity pool already exists for {token0?.symbol}/{token1?.symbol}.{' '}
      <button 
        onClick={onNavigate}
        className="text-purple-600 dark:text-purple-400 hover:underline"
      >
        Deposit to existing pool
      </button>
    </p>
  </div>
);

export default PoolExistsWarning;