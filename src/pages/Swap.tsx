import { PublicKey } from '@solana/web3.js';
import { AlertCircle, AlertTriangle, ArrowDownUp, Settings } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import SwapSettingsModal from '../components/modals/SwapSettingsModal';
import SwapDetails from '../components/SwapDetails';
import Button from '../components/ui/Button';
import Card, { CardBody, CardFooter } from '../components/ui/Card';
import { errorAlert } from '../components/ui/ToastGroup';
import TokenInput from '../components/ui/TokenInput';
import TokenSelector from '../components/ui/TokenSelector';
import { useTransactionNotifications } from '../context/TransactionContext';
import { lpPositions, tokens } from '../data/mockData';
import { Token } from '../types';
import { getPoolList, PoolData } from '../utils/getPoolList';
import { sendTransaction } from '../utils/solana';


const Swap: React.FC = () => {
  
  // Swap state
  const [fromToken, setFromToken] = useState<Token | null>(tokens[0]);
  const [toToken, setToToken] = useState<Token | null>(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  
  // Settings state
  const [slippage, setSlippage] = useState(0.5);
  const [transactionDeadline, setTransactionDeadline] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const [slippagePreset, setSlippagePreset] = useState<'auto' | 'custom'>('auto');
  const [expertMode, setExpertMode] = useState(false);
  const [poolList, setPoolList] = useState<PoolData[]>([]);
  
  // UI state
  const [showFromTokenSelector, setShowFromTokenSelector] = useState(false);
  const [showToTokenSelector, setShowToTokenSelector] = useState(false);
  
  const { showNotification } = useTransactionNotifications();
  
  const LP_FEE_PERCENT = 1; // 1% LP fee

  // Calculate derived values
  const lpFee = useMemo(() => {
    if (!fromAmount || !fromToken) return 0;
    return (parseFloat(fromAmount) * LP_FEE_PERCENT) / 100;
  }, [fromAmount, fromToken]);
  
  const minimumReceived = useMemo(() => {
    if (!toAmount || !slippage) return 0;
    const slippageMultiplier = (100 - slippage) / 100;
    return parseFloat(toAmount) * slippageMultiplier;
  }, [toAmount, slippage]);

  // Calculate conversion rate and USD values
  const conversionRate = fromToken && toToken ? fromToken.price! / toToken.price! : 0;
  const fromAmountUSD = fromAmount && fromToken ? (parseFloat(fromAmount) * fromToken.price!).toFixed(2) : '';
  const toAmountUSD = toAmount && toToken ? (parseFloat(toAmount) * toToken.price!).toFixed(2) : '';

  const getButtonLabel = () => {
    if (!fromToken || !toToken) return 'Select Tokens';
    if (!fromAmount || !toAmount) return 'Enter Amount';
    if (!hasLiquidity) return 'No Liquidity';
    return 'Swap';
  };

  const exceedsToken0Balance = fromToken && fromAmount && fromToken.balance
    ? parseFloat(fromAmount) > parseFloat(fromToken.balance)
    : false;


    useEffect(() => {
      const fetchPools = async () => {
        try {
          const poolData = await getPoolList();
          setPoolList(poolData);
        } catch (error) {
          console.error("Error fetching pool list:", error);
          errorAlert("Failed to fetch pool list!");
        }
      };
  
      fetchPools();
    }, []);
  
  // Check liquidity
  const hasLiquidity = useMemo(() => {
    if (!fromToken?.mint || !toToken?.mint) return false;
    
    return lpPositions.some(lp => {
      const token0Mint = lp.token0?.mint;
      const token1Mint = lp.token1?.mint;
      
      if (!token0Mint || !token1Mint) return false;
      
      return (
        token0Mint &&
        token1Mint &&
        fromToken.mint &&
        toToken.mint &&
        (
          (token0Mint.equals(fromToken.mint) && token1Mint.equals(toToken.mint)) ||
          (token0Mint.equals(toToken.mint) && token1Mint.equals(fromToken.mint))
        )
      );
      
    });
  }, [fromToken, toToken]);

  // Handle URL params
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token0Param = queryParams.get('token0');
    const token1Param = queryParams.get('token1');
    
    if (token0Param) {
      const foundToken = tokens.find(t => t?.mint?.equals(new PublicKey(token0Param)));
      if (foundToken) setFromToken(foundToken);
    }
    
    if (token1Param) {
      const foundToken = tokens.find(t => t?.mint?.equals(new PublicKey(token1Param)));
      if (foundToken) setToToken(foundToken);
    }
  }, []);

  // Update URL when tokens change
  useEffect(() => {
    if (fromToken?.mint && toToken?.mint) {
      const queryParams = new URLSearchParams();
      queryParams.set('token0', fromToken.mint.toString());
      queryParams.set('token1', toToken.mint.toString());
      
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${queryParams.toString()}`
      );
    }
  }, [fromToken, toToken]);

  // Handlers
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && conversionRate) {
      const converted = parseFloat(value) * conversionRate;
      setToAmount(converted.toFixed(6));
    } else {
      setToAmount('');
    }
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (value && conversionRate) {
      const converted = parseFloat(value) / conversionRate;
      setFromAmount(converted.toFixed(6));
    } else {
      setFromAmount('');
    }
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSelectFromToken = (token: Token) => {
    setFromToken(token);
    setShowFromTokenSelector(false);
    
    if (fromAmount && toToken && token.price && toToken.price) {
      const newRate = token.price / toToken.price;
      const converted = parseFloat(fromAmount) * newRate;
      setToAmount(converted.toFixed(6));
    }
  };

  const handleSelectToToken = (token: Token) => {
    setToToken(token);
    setShowToTokenSelector(false);
    
    if (toAmount && fromToken && token.price && fromToken.price) {
      const newRate = fromToken.price / token.price;
      const converted = parseFloat(toAmount) / newRate;
      setFromAmount(converted.toFixed(6));
    }
  };

  const handleMaxFromAmount = () => {
    if (fromToken?.balance) {
      setFromAmount(fromToken.balance);
      
      if (conversionRate) {
        const converted = parseFloat(fromToken.balance) * conversionRate;
        setToAmount(converted.toFixed(6));
      }
    }
  };

  const handleTransaction = async () => {
    try {
      showNotification('processing', 'Sending transaction...');
      const txHash = await sendTransaction();
      showNotification('success', 'Transaction confirmed!', txHash);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Transaction failed');
    }
  };

  

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Swap Tokens</h1>
      
      <Card className="mb-4">
        <CardBody>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Swap</h2>
            <button 
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setShowSettings(true)}
            >
              <Settings size={18} />
            </button>
          </div>
          
          <div className="mb-4">
            <TokenInput
              label="From"
              value={fromAmount}
              onChange={handleFromAmountChange}
              onSelectToken={() => setShowFromTokenSelector(true)}
              token={fromToken}
              balance={fromToken?.balance}
              maxButton
              onMaxClick={handleMaxFromAmount}
            />
          </div>

          {fromToken && fromAmountUSD && !exceedsToken0Balance && (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ≈ ${fromAmountUSD} USD
            </div>
          )}

          {exceedsToken0Balance && (
            <div className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertTriangle size={14} />
              Amount exceeds your balance
            </div>
          )}
          
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>
          
          <div className="mb-2">
            <TokenInput
              label="To"
              value={toAmount}
              onChange={handleToAmountChange}
              onSelectToken={() => setShowToTokenSelector(true)}
              token={toToken}
              balance={toToken?.balance}
            />
          </div>
          
          {toToken && toAmountUSD && (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ≈ ${toAmountUSD} USD
            </div>
          )}

          {fromToken && toToken && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              1 {fromToken.symbol} = {conversionRate.toFixed(6)} {toToken.symbol}
            </div>
          )}
          
          {fromToken && toToken && !hasLiquidity && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md flex items-start gap-2">
              <AlertCircle className="text-yellow-500 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  No liquidity pool found for this pair
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-300">
                  You won't be able to swap these tokens until liquidity is added
                </p>
              </div>
            </div>
          )}
        </CardBody>
        
        <CardFooter>
          <SwapDetails
            fromToken={fromToken}
            toToken={toToken}
            slippage={slippage}
            minimumReceived={minimumReceived}
            lpFee={lpFee}
          />
          
       
          <Button
            fullWidth
            size="lg"
            disabled={!fromAmount || !toAmount || !fromToken || !toToken || !hasLiquidity}
            onClick={handleTransaction}
          >
            {getButtonLabel()}
          </Button>
            

        </CardFooter>
      </Card>
      
      {showFromTokenSelector && (
        <TokenSelector
          onSelect={handleSelectFromToken}
          onClose={() => setShowFromTokenSelector(false)}
          excludeToken={toToken}
        />
      )}
      
      {showToTokenSelector && (
        <TokenSelector
          onSelect={handleSelectToToken}
          onClose={() => setShowToTokenSelector(false)}
          excludeToken={fromToken}
        />
      )}
      
      {showSettings && (
        <SwapSettingsModal
          slippage={slippage}
          setSlippage={setSlippage}
          transactionDeadline={transactionDeadline}
          setTransactionDeadline={setTransactionDeadline}
          slippagePreset={slippagePreset}
          setSlippagePreset={setSlippagePreset}
          expertMode={expertMode}
          setExpertMode={setExpertMode}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default Swap;