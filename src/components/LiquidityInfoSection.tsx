// components/LiquidityInfoSection.tsx
import { AlertTriangle } from 'lucide-react';

const LiquidityInfoSection = () => (
  <div className="space-y-4 text-sm">
    <div>
      <h3 className="font-medium mb-1">What is a Liquidity Pool?</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Liquidity pools are collections of tokens locked in a smart contract that facilitate trading by providing liquidity for those tokens.
      </p>
    </div>
    
    <div>
      <h3 className="font-medium mb-1">How do you earn?</h3>
      <p className="text-gray-600 dark:text-gray-400">
        When traders use the pool to swap tokens, they pay a 0.3% fee that is distributed to liquidity providers proportionally to their pool share.
      </p>
    </div>
    
    <div>
      <h3 className="font-medium mb-1">Impermanent Loss</h3>
      <p className="text-gray-600 dark:text-gray-400">
        If token prices change dramatically, you might experience impermanent loss. This occurs when holding tokens separately would have resulted in more value than providing liquidity.
      </p>
    </div>
    
    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg flex gap-2">
      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
      <p>
        Providing liquidity involves risk. Make sure you understand impermanent loss before committing significant funds.
      </p>
    </div>
  </div>
);

export default LiquidityInfoSection;