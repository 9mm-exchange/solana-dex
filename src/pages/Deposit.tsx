// components/Deposit.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card, { CardBody, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import TokenInput from '../components/ui/TokenInput';
import TokenSelector from '../components/ui/TokenSelector';
import { Token, LPPosition } from '../types';
import { tokens, lpPositions } from '../data/mockData';
import { useTransactionNotifications } from '../context/TransactionContext';
import { sendTransaction } from '../utils/solana';
import PoolSelectorModal from '../components/modals/PoolSelectorModal';
import PoolInfoCard from '../components/PoolInfoCard';
import NoPoolWarning from '../components/NoPoolWarning';
import PoolSelectorButton from '../components/PoolSelectorButton';

const Deposit: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useTransactionNotifications();

  // State management
  const [token0, setToken0] = useState<Token | null>(null);
  const [token1, setToken1] = useState<Token | null>(null);
  const [token0Amount, setToken0Amount] = useState('');
  const [token1Amount, setToken1Amount] = useState('');
  const [showToken0Selector, setShowToken0Selector] = useState(false);
  const [showToken1Selector, setShowToken1Selector] = useState(false);
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<LPPosition | null>(null);
  const [filteredPositions, setFilteredPositions] = useState<LPPosition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize tokens from URL params
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
      setToken0(tokens[0]);
      setToken1(tokens[1]);
    }
  }, [location.search]);

  // Filter LP positions when tokens change
  useEffect(() => {
    if (token0 && token1) {
      const filtered = lpPositions.filter(position => 
        (position.token0.id === token0.id && position.token1.id === token1.id) ||
        (position.token0.id === token1.id && position.token1.id === token0.id)
      );
      setFilteredPositions(filtered);
      
      if (filtered.length === 1) {
        setSelectedPosition(filtered[0]);
      } else {
        setSelectedPosition(null);
      }
    } else {
      setFilteredPositions([]);
      setSelectedPosition(null);
    }
  }, [token0, token1]);

  // Transaction handler
  const handleTransaction = useCallback(async () => {
    try {
      showNotification('processing', 'Sending transaction...');
      const txHash = await sendTransaction();
      showNotification('success', 'Transaction confirmed!', txHash);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Transaction failed');
    }
  }, [showNotification]);

  // Token amount change handlers
  const handleToken0AmountChange = useCallback((value: string) => {
    setToken0Amount(value);
    if (value && token0 && token1 && token0.price && token1.price) {
      const ratio = token0.price / token1.price;
      setToken1Amount((parseFloat(value) * ratio).toFixed(6));
    } else {
      setToken1Amount('');
    }
  }, [token0, token1]);

  const handleToken1AmountChange = useCallback((value: string) => {
    setToken1Amount(value);
    if (value && token0 && token1 && token0.price && token1.price) {
      const ratio = token1.price / token0.price;
      setToken0Amount((parseFloat(value) * ratio).toFixed(6));
    } else {
      setToken0Amount('');
    }
  }, [token0, token1]);

  // Max amount handlers
  const handleMaxToken0 = useCallback(() => {
    if (token0?.balance) {
      handleToken0AmountChange(token0.balance);
    }
  }, [token0, handleToken0AmountChange]);

  const handleMaxToken1 = useCallback(() => {
    if (token1?.balance) {
      handleToken1AmountChange(token1.balance);
    }
  }, [token1, handleToken1AmountChange]);

  // Pool selection handler
  const handleSelectPosition = useCallback((position: LPPosition) => {
    setToken0(position.token0);
    setToken1(position.token1);
    setToken0Amount('');
    setToken1Amount('');
    setSelectedPosition(position);
    setShowPositionSelector(false);
    navigate(`?token0=${position.token0.mint?.toString()}&token1=${position.token1.mint?.toString()}`, { replace: true });
  }, [navigate]);

  // Create new pool handler
  const handleCreateNewPool = useCallback(() => {
    if (token0 && token1) {
      navigate(`/create-lp?token0=${token0.mint?.toString()}&token1=${token1.mint?.toString()}`);
    }
  }, [token0, token1, navigate]);

  // Filter pools based on search query
  const filteredPools = useCallback(() => {
    if (!searchQuery) return lpPositions;
    const query = searchQuery.toLowerCase();
    return lpPositions.filter(pool => (
      pool.token0.symbol.toLowerCase().includes(query) ||
      pool.token1.symbol.toLowerCase().includes(query) ||
      pool.token0.name.toLowerCase().includes(query) ||
      pool.token1.name.toLowerCase().includes(query)
    ));
  }, [searchQuery]);

  // Calculate USD values
  const token0UsdValue = token0 && token0Amount ? parseFloat(token0Amount) * token0.price! : 0;
  const token1UsdValue = token1 && token1Amount ? parseFloat(token1Amount) * token1.price! : 0;
  const totalUsdValue = token0UsdValue + token1UsdValue;

  // Balance checks
  const exceedsToken0Balance = token0 && token0Amount && token0.balance
    ? parseFloat(token0Amount) > parseFloat(token0.balance)
    : false;

  const exceedsToken1Balance = token1 && token1Amount && token1.balance
    ? parseFloat(token1Amount) > parseFloat(token1.balance)
    : false;

  // Button text logic
  const getButtonText = useCallback(() => {
    if (!token0 || !token1) return 'Select Tokens';
    if (!selectedPosition) return filteredPositions.length > 0 ? 'Select Pool' : 'Create New Pool';
    if (exceedsToken0Balance || exceedsToken1Balance) return 'Insufficient Balance';
    return 'Add Liquidity';
  }, [token0, token1, selectedPosition, filteredPositions, exceedsToken0Balance, exceedsToken1Balance]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Deposit Liquidity</h1>

      <Card className="mb-4">
        <CardBody>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Select Tokens</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Choose the token pair you want to provide liquidity for
            </p>
          </div>

          <div className="space-y-4">
            <TokenInput
              label="First Token"
              value={token0Amount}
              onChange={handleToken0AmountChange}
              onSelectToken={() => setShowToken0Selector(true)}
              token={token0}
              balance={token0?.balance}
              maxButton
              onMaxClick={handleMaxToken0}
            />
            {exceedsToken0Balance && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle size={14} />
                Amount exceeds your balance
              </div>
            )}
            {token0Amount && !exceedsToken0Balance && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ≈ ${token0UsdValue.toFixed(2)} USD
              </div>
            )}

            <TokenInput
              label="Second Token"
              value={token1Amount}
              onChange={handleToken1AmountChange}
              onSelectToken={() => setShowToken1Selector(true)}
              token={token1}
              balance={token1?.balance}
              maxButton
              onMaxClick={handleMaxToken1}
            />
            {exceedsToken1Balance && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle size={14} />
                Amount exceeds your balance
              </div>
            )}
            {token1Amount && !exceedsToken1Balance && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                ≈ ${token1UsdValue.toFixed(2)} USD
              </div>
            )}
          </div>

          {token0 && token1 && (
            <div className="mt-6 space-y-4">
              <PoolSelectorButton
                position={selectedPosition}
                onClick={() => setShowPositionSelector(true)}
              />

              {filteredPositions.length === 0 && (
                <NoPoolWarning
                  token0Symbol={token0.symbol}
                  token1Symbol={token1.symbol}
                  onCreateNew={handleCreateNewPool}
                />
              )}
            </div>
          )}

          <PoolInfoCard
            position={selectedPosition}
            token0Amount={token0Amount}
            token1Amount={token1Amount}
            totalUsdValue={totalUsdValue}
          />
        </CardBody>

        <CardFooter>
          <div className="space-y-3 w-full">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                Network Fee <Info size={14} />
              </div>
              <div>~0.0005 SOL</div>
            </div>

            <Button 
              fullWidth 
              size="lg" 
              disabled={
                !token0Amount || 
                !token1Amount || 
                !selectedPosition ||
                exceedsToken0Balance ||
                exceedsToken1Balance
              }
              onClick={handleTransaction}
            >
              {getButtonText()}
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Prices and pool ratios are subject to change based on market conditions.
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* Token Selector Modals */}
      {showToken0Selector && (
        <TokenSelector
          selectedToken={token0}
          excludeToken={token1}
          onSelect={(token) => {
            setToken0(token);
            setToken0Amount('');
            setToken1Amount('');
            setShowToken0Selector(false);
            navigate(`?token0=${token.mint?.toString()}&token1=${token1?.mint?.toString()}`, { replace: true });
          }}
          onClose={() => setShowToken0Selector(false)}
        />
      )}

      {showToken1Selector && (
        <TokenSelector
          selectedToken={token1}
          excludeToken={token0}
          onSelect={(token) => {
            setToken1(token);
            setToken0Amount('');
            setToken1Amount('');
            setShowToken1Selector(false);
            navigate(`?token0=${token0?.mint?.toString()}&token1=${token.mint?.toString()}`, { replace: true });
          }}
          onClose={() => setShowToken1Selector(false)}
        />
      )}

      <PoolSelectorModal
        show={showPositionSelector}
        onClose={() => setShowPositionSelector(false)}
        positions={filteredPools()}
        selectedPosition={selectedPosition}
        onSelect={handleSelectPosition}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
};

export default Deposit;