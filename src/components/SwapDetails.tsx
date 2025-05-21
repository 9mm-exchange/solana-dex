// components/SwapDetails.tsx
import React from 'react';
import { Info } from 'lucide-react';
import { Token } from '../types';

interface SwapDetailsProps {
  fromToken?: Token | null;
  toToken?: Token | null;
  slippage: number;
  minimumReceived: number;
  lpFee: number;
}

const SwapDetails: React.FC<SwapDetailsProps> = ({
  fromToken,
  toToken,
  slippage,
  minimumReceived,
  lpFee,
}) => {
  return (
    <div className="space-y-3 w-full mb-5">
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          Price Impact <Info size={14} />
        </div>
        <div className="text-green-500">0.03%</div>
      </div>
      
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          LP Fee <Info size={14} />
        </div>
        <div>
          {lpFee ? `${lpFee.toFixed(6)} ${fromToken?.symbol || ''}` : '-'}
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          Slippage Tolerance <Info size={14} />
        </div>
        <div>{slippage}%</div>
      </div>
      
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          Minimum Received <Info size={14} />
        </div>
        <div>
          {minimumReceived ? `${minimumReceived.toFixed(6)} ${toToken?.symbol || ''}` : '-'}
        </div>
      </div>
    </div>
  );
};

export default SwapDetails;