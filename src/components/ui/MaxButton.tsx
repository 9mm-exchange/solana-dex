// components/ui/MaxButton.tsx
interface MaxButtonProps {
    onClick: () => void;
    disabled?: boolean;
  }
  
  const MaxButton: React.FC<MaxButtonProps> = ({ onClick, disabled }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      MAX
    </button>
  );
  
  export default MaxButton;