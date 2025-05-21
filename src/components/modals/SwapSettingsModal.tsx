// components/SwapSettingsModal.tsx
import React from 'react';
import { X } from 'lucide-react';
import Card, { CardBody, CardFooter } from '../ui/Card';
import Button from '../ui/Button';

interface SwapSettingsModalProps {
  slippage: number;
  setSlippage: (value: number) => void;
  transactionDeadline: number;
  setTransactionDeadline: (value: number) => void;
  slippagePreset: 'auto' | 'custom';
  setSlippagePreset: (value: 'auto' | 'custom') => void;
  expertMode: boolean;
  setExpertMode: (value: boolean) => void;
  onClose: () => void;
}

const SwapSettingsModal: React.FC<SwapSettingsModalProps> = ({
  slippage,
  setSlippage,
  transactionDeadline,
  setTransactionDeadline,
  slippagePreset,
  setSlippagePreset,
  expertMode,
  setExpertMode,
  onClose,
}) => {
  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setSlippage(value);
      setSlippagePreset('custom');
    }
  };

  const handleDeadlineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setTransactionDeadline(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardBody>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Transaction Settings</h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">Slippage Tolerance</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSlippage(0.5);
                      setSlippagePreset('auto');
                    }}
                    className={`px-3 py-1 text-xs rounded-md ${slippagePreset === 'auto' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => {
                      setSlippage(1.0);
                      setSlippagePreset('custom');
                    }}
                    className={`px-3 py-1 text-xs rounded-md ${slippagePreset === 'custom' && slippage === 1.0 ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    1.0%
                  </button>
                  <button
                    onClick={() => {
                      setSlippage(3.0);
                      setSlippagePreset('custom');
                    }}
                    className={`px-3 py-1 text-xs rounded-md ${slippagePreset === 'custom' && slippage === 3.0 ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
                  >
                    3.0%
                  </button>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={slippagePreset === 'auto' ? '' : slippage}
                  onChange={handleSlippageChange}
                  placeholder={slippagePreset === 'auto' ? 'Auto' : ''}
                  className="w-full p-2 pl-3 pr-8 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
                  min="0"
                  max="50"
                  step="0.1"
                  disabled={slippagePreset === 'auto'}
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Transaction Deadline (minutes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={transactionDeadline}
                  onChange={handleDeadlineChange}
                  className="w-full p-2 pl-3 pr-8 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent"
                  min="1"
                  max="60"
                />
                <span className="absolute right-3 top-2 text-gray-500">mins</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <label className="block text-sm font-medium mb-1">Expert Mode</label>
                <p className="text-xs text-gray-500">
                  Allow high slippage trades (use at your own risk)
                </p>
              </div>
              <button
                onClick={() => setExpertMode(!expertMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${expertMode ? 'bg-red-500' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${expertMode ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </CardBody>
        
        <CardFooter className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SwapSettingsModal;