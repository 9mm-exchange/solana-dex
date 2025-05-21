import { CheckCircle2, X } from 'lucide-react';

export const SuccessNotification: React.FC<{ 
  message: string; 
  txHash?: string;
  onClose: () => void 
}> = ({ message, txHash, onClose }) => (
  <div className="bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200 p-4 rounded-lg shadow-lg flex items-start">
    <CheckCircle2 className="h-5 w-5 mr-3 mt-0.5" />
    <div className="flex-1">
      <h3 className="font-medium">Transaction Successful</h3>
      <p className="text-sm mt-1">{message}</p>
      {txHash && (
        <a href={`https://solscan.io/tx/${txHash}?cluster=devnet`} className="text-sm mt-2 inline-block font-medium hover:underline">
          View on Solscan
        </a>
      )}
    </div>
    <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
      <X className="h-4 w-4" />
    </button>
  </div>
);