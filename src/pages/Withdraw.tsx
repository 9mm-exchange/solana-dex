// components/WithdrawLP.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PublicKey } from '@solana/web3.js';
import Card, { CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LPPosition } from '../types';
import { myPositions as lpPositions } from '../data/mockData';
import { useTransactionNotifications } from '../context/TransactionContext';
import { sendTransaction } from '../utils/solana';
import PositionSelectorModal from '../components/modals/PositionSelectorModal';
import PositionInputSection from '../components/PositionInputSection';
import TokenBreakdownCard from '../components/TokenBreakdownCard';
import PriceInfoCard from '../components/PriceInfoCard';
import WarningAlert from '../components/ui/WarningAlert';

const WithdrawLP: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { showNotification } = useTransactionNotifications();
  
  // Get token parameters from URL
  const token0Param = searchParams.get('token0');
  const token1Param = searchParams.get('token1');

  // State management
  const [selectedPosition, setSelectedPosition] = useState<LPPosition | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPositions, setFilteredPositions] = useState<LPPosition[]>(lpPositions);
  const [token0Amount, setToken0Amount] = useState('0');
  const [token1Amount, setToken1Amount] = useState('0');

  // Handle max button
  const handleMaxAmount = useCallback(() => {
    if (selectedPosition?.balance) {
      setWithdrawAmount(selectedPosition.balance);
    }
  }, [selectedPosition]);

  // Handle transaction
  const handleTransaction = useCallback(async () => {
    try {
      showNotification('processing', 'Sending transaction...');
      const txHash = await sendTransaction();
      showNotification('success', 'Transaction confirmed!', txHash);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Transaction failed');
    }
  }, [showNotification]);

  // Handle URL parameters on component mount
  useEffect(() => {
    if (token0Param && token1Param) {
      const token0Mint = new PublicKey(token0Param);
      const token1Mint = new PublicKey(token1Param);
      
      const foundPosition = lpPositions.find(position => 
        position.token0?.mint && position.token1?.mint && (
          (position.token0.mint.equals(token0Mint) && position.token1.mint.equals(token1Mint)) ||
          (position.token0.mint.equals(token1Mint) && position.token1.mint.equals(token0Mint))
        )
      );
      
      if (foundPosition) {
        setSelectedPosition(foundPosition);
      }
    }
  }, [token0Param, token1Param]);

  // Filter positions based on search query
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredPositions(
        lpPositions.filter(position => 
          position.token0.symbol.toLowerCase().includes(query) ||
          position.token1.symbol.toLowerCase().includes(query) ||
          position.token0.name.toLowerCase().includes(query) ||
          position.token1.name.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredPositions(lpPositions);
    }
  }, [searchQuery]);
  
  // Calculate token amounts when position or withdraw amount changes
  useEffect(() => {
    if (selectedPosition && withdrawAmount) {
      const amount = parseFloat(withdrawAmount);
      const total = parseFloat(selectedPosition.balance);
      const ratio = amount / total;
      
      setToken0Amount((ratio * parseFloat(selectedPosition.token0Amount)).toFixed(6));
      setToken1Amount((ratio * parseFloat(selectedPosition.token1Amount)).toFixed(6));
    } else {
      setToken0Amount('0');
      setToken1Amount('0');
    }
  }, [selectedPosition, withdrawAmount]);
  
  // Calculate USD values
  const token0UsdValue = selectedPosition && token0Amount 
    ? parseFloat(token0Amount) * selectedPosition.token0.price!
    : 0;
  
  const token1UsdValue = selectedPosition && token1Amount 
    ? parseFloat(token1Amount) * selectedPosition.token1.price!
    : 0;
  
  const totalUsdValue = token0UsdValue + token1UsdValue;
  
  // Check if amount exceeds balance
  const exceedsBalance = selectedPosition && withdrawAmount && selectedPosition.balance
    ? parseFloat(withdrawAmount) > parseFloat(selectedPosition.balance)
    : false;
  
  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Remove Liquidity</h1>
      
      <Card className="mb-4">
        <CardBody>
          <PositionInputSection
            selectedPosition={selectedPosition}
            onSelect={() => setShowPositionSelector(true)}
            withdrawAmount={withdrawAmount}
            onAmountChange={setWithdrawAmount}
            onMaxClick={handleMaxAmount}
            exceedsBalance={exceedsBalance}
          />
          
          {selectedPosition && withdrawAmount && !exceedsBalance && (
            <TokenBreakdownCard
              position={selectedPosition}
              token0Amount={token0Amount}
              token1Amount={token1Amount}
              token0UsdValue={token0UsdValue}
              token1UsdValue={token1UsdValue}
              totalUsdValue={totalUsdValue}
            />
          )}
          
          {selectedPosition && (
            <PriceInfoCard
              position={selectedPosition}
              withdrawAmount={withdrawAmount}
              balance={selectedPosition.balance}
            />
          )}
          
          <WarningAlert />
        </CardBody>
        
        <CardFooter>
          <div className="space-y-3 w-full">
            <Button 
              fullWidth 
              size="lg"
              disabled={
                !selectedPosition || 
                !withdrawAmount || 
                exceedsBalance
              }
              onClick={handleTransaction}
            >
              {!selectedPosition
                ? 'Select Position'
                : !withdrawAmount
                ? 'Enter Amount'
                : exceedsBalance
                ? 'Insufficient Balance'
                : 'Remove Liquidity'}
            </Button>
            
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Network Fee</span>
              <span>~0.0005 SOL</span>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <PositionSelectorModal
        show={showPositionSelector}
        onClose={() => setShowPositionSelector(false)}
        positions={filteredPositions}
        selectedPosition={selectedPosition}
        onSelect={(position) => {
          setSelectedPosition(position);
          setShowPositionSelector(false);
          setWithdrawAmount('');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
};

export default WithdrawLP;