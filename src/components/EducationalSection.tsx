// components/EducationalSection.tsx
const EducationalSection = () => (
    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
      <h2 className="text-xl font-bold mb-3">About Liquidity Provision</h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        When you provide liquidity, you deposit an equal value of two tokens to a liquidity pool. In return, you receive LP tokens representing your share of the pool.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="font-medium mb-1">Earn Trading Fees</div>
          <p className="text-gray-500 dark:text-gray-400">
            You earn a portion of trading fees whenever someone trades using your liquidity.
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="font-medium mb-1">Impermanent Loss</div>
          <p className="text-gray-500 dark:text-gray-400">
            Be aware of impermanent loss when token prices change relative to when you deposited.
          </p>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
          <div className="font-medium mb-1">Long-term Strategy</div>
          <p className="text-gray-500 dark:text-gray-400">
            Liquidity provision is typically more profitable as a long-term strategy.
          </p>
        </div>
      </div>
    </div>
  );
  
  export default EducationalSection;