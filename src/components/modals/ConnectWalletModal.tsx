import React from 'react';
import { X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface ConnectWalletModalProps {
  onClose: () => void;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({ onClose }) => {
  const { connected } = useWallet();

  React.useEffect(() => {
    if (connected) {
      onClose();
    }
  }, [connected, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black">Connect Wallet</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Connect your Solana wallet to start trading, providing liquidity, and earning rewards.
          </p>
          
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-xl" />
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">Supported wallets:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Phantom</li>
              <li>Solflare</li>
              <li>Backpack</li>
              <li>Glow</li>
            </ul>
          </div>
          
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm">
            <p className="text-purple-700 dark:text-purple-300">
              New to Solana? Visit the{' '}
              <a
                href="https://solana.com/developers/guides"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-purple-600"
              >
                Solana Guide
              </a>{' '}
              to learn more.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletModal;