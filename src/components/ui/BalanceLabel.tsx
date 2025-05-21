// components/ui/BalanceLabel.tsx
interface BalanceLabelProps {
    balance?: string;
  }
  
  const BalanceLabel: React.FC<BalanceLabelProps> = ({ balance }) => (
    balance ? (
      <span className="text-gray-500 dark:text-gray-400">
        Balance: {balance}
      </span>
    ) : null
  );
  
  export default BalanceLabel;