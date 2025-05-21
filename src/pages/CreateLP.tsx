// components/CreateLP.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card, { CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import TokenSelector from '../components/ui/TokenSelector';
import { Token } from '../types';
import { tokens, lpPositions } from '../data/mockData';
import { sendTransaction } from '../utils/solana';
import { useTransactionNotifications } from '../context/TransactionContext';
import PoolInfoCard from '../components/PoolInfoCard';
import TokenInputSection from '../components/TokenInputSection';
import PoolExistsWarning from '../components/PoolExistsWarning';
import LiquidityInfoSection from '../components/LiquidityInfoSection';
import { Info } from 'lucide-react';

const CreateLP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [showToken0Selector, setShowToken0Selector] = useState(false);
  const [showToken1Selector, setShowToken1Selector] = useState(false);
  const [poolExists, setPoolExists] = useState(false);
  const { showNotification } = useTransactionNotifications();

  // Set tokens from URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token0Param = params.get('token0');
    const token1Param = params.get('token1');

    if (token0Param && token1Param) {
      const token0Found = tokens.find(t => t.mint?.toString() === token0Param);
      const token1Found = tokens.find(t => t.mint?.toString() === token1Param);
      
      if (token0Found) setToken0(token0Found);
      if (token1Found) setToken1(token1Found);
    } else {
      // Default tokens if no URL params
      setToken0(tokens[0]);
      setToken1(tokens[1]);
    }
  }, [location.search]);

  // Check if pool exists when tokens change
  useEffect(() => {
    if (token0 && token1) {
      const exists = lpPositions.some(pool =>
        (pool.token0.id === token0.id && pool.token1.id === token1.id) ||
        (pool.token0.id === token1.id && pool.token1.id === token0.id)
      );
      setPoolExists(exists);
    } else {
      setPoolExists(false);
    }
  }, [token0, token1]);

  const handleTransaction = useCallback(async () => {
    try {
      showNotification('processing', 'Sending transaction...');
      const txHash = await sendTransaction();
      showNotification('success', 'Transaction confirmed!', txHash);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Transaction failed');
    }
  }, [showNotification]);

  const handleAmountChange = useCallback((setAmount: React.Dispatch<React.SetStateAction<string>>, otherToken: Token | null) => 
    (value: string) => {
      setAmount(value);
      if (value && token0 && token1 && token0.price && token1.price) {
        const ratio = otherToken === token0 ? token1.price / token0.price : token0.price / token1.price;
        const converted = parseFloat(value) * ratio;
        otherToken === token0 ? setAmount1(converted.toFixed(6)) : setAmount0(converted.toFixed(6));
      }
    },
  [token0, token1]);

  const handleMaxAmount = useCallback((token: Token | null, isToken0: boolean) => {
    if (!token?.balance) return;
    
    // Directly set the amount for the selected token
    if (isToken0) {
      setAmount0(token.balance);
      // Calculate the corresponding amount for the other token
      if (token0 && token1 && token0.price && token1.price) {
        const ratio = token0.price / token1.price;
        setAmount1((parseFloat(token.balance) * ratio).toFixed(6));
      }
    } else {
      setAmount1(token.balance);
      // Calculate the corresponding amount for the other token
      if (token0 && token1 && token0.price && token1.price) {
        const ratio = token1.price / token0.price;
        setAmount0((parseFloat(token.balance) * ratio).toFixed(6));
      }
    }
  }, [token0, token1]);

  const handleSelectToken = useCallback((token: Token, setToken: React.Dispatch<React.SetStateAction<Token | null>>, isToken0: boolean) => {
    setToken(token);
    if (isToken0) {
      setShowToken0Selector(false);
      if (amount0 && token1 && token.price && token1.price) {
        const ratio = token.price / token1.price;
        const converted = parseFloat(amount0) * ratio;
        setAmount1(converted.toFixed(6));
      }
    } else {
      setShowToken1Selector(false);
      if (amount1 && token0 && token0.price && token.price) {
        const ratio = token.price / token0.price;
        const converted = parseFloat(amount1) * ratio;
        setAmount0(converted.toFixed(6));
      }
    }
    navigate(`?token0=${isToken0 ? token.mint?.toString() : token0?.mint?.toString()}&token1=${isToken0 ? token1?.mint?.toString() : token.mint?.toString()}`, { replace: true });
  }, [amount0, amount1, token0, token1, navigate]);

  const handleNavigateToDeposit = useCallback(() => {
    if (token0 && token1) {
      navigate(`/deposit?token0=${token0.mint?.toString()}&token1=${token1.mint?.toString()}`);
    }
  }, [token0, token1, navigate]);

  const token0UsdValue = token0 && amount0 ? parseFloat(amount0) * token0.price! : 0;
  const token1UsdValue = token1 && amount1 ? parseFloat(amount1) * token1.price! : 0;
  const totalValueUSD = token0UsdValue + token1UsdValue;
  
  const exceedsToken0Balance = token0 && amount0 && token0.balance
    ? parseFloat(amount0) > parseFloat(token0.balance)
    : false;
  
  const exceedsToken1Balance = token1 && amount1 && token1.balance
    ? parseFloat(amount1) > parseFloat(token1.balance)
    : false;

  const getButtonText = () => {
    if (!token0 || !token1) return 'Select Tokens';
    if (!amount0 || !amount1) return 'Enter Amounts';
    if (exceedsToken0Balance || exceedsToken1Balance) return 'Insufficient Balance';
    if (poolExists) return 'Pool Already Exists';
    return 'Create Liquidity Pool';
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Liquidity Pool</h1>
      
      <Card className="mb-6">
        <CardBody>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Create Pool</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {poolExists 
                ? 'This pool already exists. You can deposit liquidity instead.'
                : 'Create a new liquidity pool or add to an existing one to earn trading fees.'}
            </p>
          </div>
          
          <TokenInputSection
            label="First Token"
            amount={amount0}
            token={token0}
            balance={token0?.balance}
            usdValue={token0UsdValue}
            exceedsBalance={exceedsToken0Balance}
            onChange={handleAmountChange(setAmount0, token1)}
            onSelectToken={() => setShowToken0Selector(true)}
            onMaxClick={() => handleMaxAmount(token0, true)}
          />
          
          <TokenInputSection
            label="Second Token"
            amount={amount1}
            token={token1}
            balance={token1?.balance}
            usdValue={token1UsdValue}
            exceedsBalance={exceedsToken1Balance}
            onChange={handleAmountChange(setAmount1, token0)}
            onSelectToken={() => setShowToken1Selector(true)}
            onMaxClick={() => handleMaxAmount(token1, false)}
          />
          
          <PoolInfoCard
            token0={token0}
            token1={token1}
            amount0={amount0}
            amount1={amount1}
            totalValueUSD={totalValueUSD}
            poolExists={poolExists}
          />

          {poolExists && (
            <PoolExistsWarning
              token0={token0}
              token1={token1}
              onNavigate={handleNavigateToDeposit}
            />
          )}
        </CardBody>
        
        <CardFooter>
          <div className="space-y-3 w-full">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                LP Fee <Info size={14} />
              </div>
              <div>0.3%</div>
            </div>
            
            <Button 
              fullWidth  
              size="lg"
              disabled={
                !amount0 || 
                !amount1 || 
                !token0 || 
                !token1 || 
                exceedsToken0Balance || 
                exceedsToken1Balance ||
                poolExists
              }
              onClick={handleTransaction}
            >
              {getButtonText()}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">About Liquidity Provision</h2>
          <LiquidityInfoSection />
        </CardBody>
      </Card>
      
      {showToken0Selector && (
        <TokenSelector
          onSelect={(token) => handleSelectToken(token, setToken0, true)}
          onClose={() => setShowToken0Selector(false)}
          excludeToken={token1}
        />
      )}
      
      {showToken1Selector && (
        <TokenSelector
          onSelect={(token) => handleSelectToken(token, setToken1, false)}
          onClose={() => setShowToken1Selector(false)}
          excludeToken={token0}
        />
      )}
    </div>
  );
};

export default CreateLP;