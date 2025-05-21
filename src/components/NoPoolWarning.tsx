// components/NoPoolWarning.tsx
import { AlertTriangle } from 'lucide-react';
import { NoPoolWarningProps } from '../types';


const NoPoolWarning: React.FC<NoPoolWarningProps> = ({
  token0Symbol,
  token1Symbol,
  onCreateNew,
}) => (
  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg">
    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
    <p className="text-sm">
      No existing pools found for {token0Symbol}/{token1Symbol}.{' '}
      <button 
        onClick={onCreateNew}
        className="text-purple-600 dark:text-purple-400 hover:underline"
      >
        Create New Pool
      </button>
    </p>
  </div>
);

export default NoPoolWarning;