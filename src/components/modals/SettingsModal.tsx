// components/modals/SettingsModal.tsx
import { X } from 'lucide-react';

interface SettingsModalProps {
  rpcEndpoint: string;
  gasPriority: 'low' | 'medium' | 'high';
  onRpcChange: (value: string) => void;
  onGasPriorityChange: (value: 'low' | 'medium' | 'high') => void;
  onClose: () => void;
  onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  rpcEndpoint,
  gasPriority,
  onRpcChange,
  onGasPriorityChange,
  onClose,
  onSave,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">DEX Settings</h3>
            <button 
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">RPC Endpoint</label>
              <select
                value={rpcEndpoint}
                onChange={(e) => onRpcChange(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
              >
                <option value="https://api.mainnet-beta.solana.com">Mainnet (Solana)</option>
                <option value="https://solana-api.projectserum.com">Serum RPC</option>
                <option value="https://solana-api.quicknode.com">QuickNode</option>
                <option value="https://solana-api.genesysgo.net">GenesysGo</option>
                <option value="custom">Custom RPC</option>
              </select>
              
              {rpcEndpoint === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter custom RPC URL"
                  className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
                  onChange={(e) => onRpcChange(e.target.value)}
                />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Gas Priority</label>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => onGasPriorityChange(priority)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      gasPriority === priority 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;