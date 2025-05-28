"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AlertCircle, ArrowDownUp, ChevronDown, Settings } from "lucide-react";
import React, {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import SelectTokenModal from "../components/modals/SelectTokenModal";
import SettingModal from "../components/modals/SettingModal";
import SwapDetailsNew from "../components/SwapDetailsNew";
import Button from "../components/ui/Button";
import Card, { CardBody, CardFooter } from "../components/ui/Card";
import { errorAlert } from "../components/ui/ToastGroup";
import WalletButton from "../components/ui/WalletButton";
import { useTransactionNotifications } from "../context/TransactionContext";
import UserContext from "../context/UserContext";
import {
  getPoolAddress,
  getSwapOut,
  getTokenBalance,
  swap,
} from "../program/web3";
import { PoolData, TokenData } from "../types";
import { getPoolList } from "../utils/getPoolList";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import { calculateSwapAmounts } from "../program/web3";

const Swap: React.FC = () => {
  const wallet = useWallet();
  const { isLoading, setIsLoading } = useContext(UserContext);
  const [slippageModal, setSlippageModal] = useState(false);

  const [sellTokenData, setSellTokenData] = useState<TokenData | null>(null);
  const [buyTokenData, setBuyTokenData] = useState<TokenData | null>(null);
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<number>(0);
  const [selectTokenModalState, setSelectTokenModalState] = useState(false);
  const [selectTokenState, setSelectTokenState] = useState<"buy" | "sell">(
    "sell"
  );
  const [buyBalance, setBuyBalance] = useState<number>(0);
  const [sellBalance, setSellBalance] = useState<number>(0);
  const [direction, setDirection] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [swapAvailable, setSwapAvailable] = useState(false);
  const [poolAddr, setPoolAddr] = useState<PublicKey | null>(null);
  const [poolList, setPoolList] = useState<PoolData[]>([]);

  // Settings state
  const [slippage, setSlippage] = useState(0.5);
  const [transactionDeadline, setTransactionDeadline] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const [slippagePreset, setSlippagePreset] = useState<"auto" | "custom">(
    "auto"
  );
  const [expertMode, setExpertMode] = useState(false);

  const { showNotification } = useTransactionNotifications();
  // const hasFetched = useRef(false);

  const LP_FEE_PERCENT = 1; // 1% LP fee

  // Calculate derived values
  const lpFee = useMemo(() => {
    if (!sellAmount || !sellTokenData) return 0;
    return (sellAmount * LP_FEE_PERCENT) / 100;
  }, [sellAmount, sellTokenData]);

  const minimumReceived = useMemo(() => {
    if (!buyAmount || !slippage) return 0;
    const slippageMultiplier = (100 - slippage) / 100;
    return buyAmount * slippageMultiplier;
  }, [buyAmount, slippage]);

  // const sellAmountUSD = sellAmount && sellTokenData ? (parseFloat(sellAmount) * sellTokenData.price!).toFixed(2) : '';
  // const buyAmountUSD = buyAmount && buyTokenData ? (parseFloat(buyAmount) * buyTokenData.price!).toFixed(2) : '';

  const fetchBalance = async () => {
    try {
      if (wallet.publicKey && sellTokenData) {
        const sellBal = await getTokenBalance(
          wallet.publicKey.toBase58(),
          sellTokenData.address
        );
        setSellBalance(sellBal);
      }

      if (wallet.publicKey && buyTokenData) {
        const buyBal = await getTokenBalance(
          wallet.publicKey.toBase58(),
          buyTokenData.address
        );
        setBuyBalance(buyBal);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
      errorAlert("Failed to fetch token balances!");
    }
  };

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const poolData = await getPoolList();
        console.log("🚀 ~ fetchPools ~ poolList:", poolData);
        setPoolList(poolData);
      } catch (error) {
        console.error("Error fetching pools:", error);
        errorAlert("Failed to fetch pool list!");
      }
    };

    fetchPools();
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchBalance();

    const fetchPool = async () => {
      if (!sellTokenData || !buyTokenData) return;

      try {
        let pool: PublicKey | null = null;

        const poolAddress = await getPoolAddress(
          wallet,
          sellTokenData.address,
          buyTokenData.address
        );

        const poolExists = poolList.find(
          (pool) => pool.address === poolAddress.toBase58()
        );

        if (poolExists) {
          pool = poolAddress;
        } else {
          const reversePoolAddress = await getPoolAddress(
            wallet,
            buyTokenData.address,
            sellTokenData.address
          );

          const reversePoolExists = poolList.find(
            (pool) => pool.address === reversePoolAddress.toBase58()
          );

          if (reversePoolExists) {
            pool = reversePoolAddress;
          }
        }

        if (pool) {
          console.log("Pool found:", pool.toBase58());
          setPoolAddr(pool);
          setSwapAvailable(true);
        } else {
          console.log("sellTokenData", sellTokenData);
          console.log("buyTokenData", buyTokenData);
          console.warn("No matching pools found.");
          setPoolAddr(null);
          setSwapAvailable(false);
        }
      } catch (error) {
        console.error("Error fetching pool address:", error);
        errorAlert("Failed to fetch pool information!");
        setPoolAddr(null);
      }
    };

    fetchPool();
    setSellAmount(0);
    setBuyAmount(0);
  }, [wallet.publicKey, sellTokenData, buyTokenData, poolList]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const getBuyAmount = async () => {
      calculateOutputAmount(sellAmount);
    };
    getBuyAmount();
  }, [sellAmount]);

  const calculateOutputAmount = async (inputAmount: number) => {
    if (
      !sellTokenData ||
      !buyTokenData ||
      !wallet.publicKey ||
      inputAmount <= 0 ||
      poolAddr == null
    ) {
      setBuyAmount(0);
      return;
    }

    setIsCalculating(true);
    try {
      const result = await calculateSwapAmounts(
        wallet,
        sellTokenData.address,
        buyTokenData.address,
        poolAddr,
        inputAmount
      );
      if (result) {
        setBuyAmount(result.outputAmount);
        // You can also use the fee information here if needed
        // result.tradeFee, result.protocolFee, result.fundFee, result.priceImpact
      } else {
        setBuyAmount(0);
      }
    } catch (error) {
      console.error("Error calculating output amount:", error);
      errorAlert("Failed to calculate output amount!");
      setBuyAmount(0);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const numericValue = Number(value);

    if (!isNaN(numericValue) && numericValue >= 0) {
      setSellAmount(numericValue);
      await calculateOutputAmount(numericValue);
    }
  };

  const handleSwap = async (amount: number) => {
    if (!sellTokenData || !sellTokenData.address || !poolAddr) {
      errorAlert("Missing token data or pool address");
      return;
    }
    setIsLoading(true);
    try {
      showNotification('processing', `Swapping ${amount} ${sellTokenData.symbol} for ${buyTokenData?.symbol}...`);
     
      const txHash = await swap(
        wallet,
        poolAddr,
        amount,
        direction
      );
        console.log("🚀 ~ handleSwap ~ txHash:", txHash)
        setIsLoading(false);

        if (txHash instanceof WalletSignTransactionError) {
          showNotification('error', 'Transaction was not signed. Please try again.');
          return;
        }

        if (txHash && typeof txHash === 'string') {
          showNotification('success', `Successfully swapped ${amount} ${sellTokenData.symbol} for ${buyTokenData?.symbol}`, txHash);
          fetchBalance();
        } else {
          showNotification('error', 'Transaction failed, The swap transaction was not completed successfully');
        }
    } catch (error) {
      setIsLoading(false);
      console.error("Error during swap:", error);
      let errorMessage = 'Transaction failed';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      showNotification('error', errorMessage);
    }
  };

  const setMax = () => {
    setSellAmount(sellBalance);
  };

  if (sellAmount > sellBalance) {
    setSellAmount(sellBalance);
  }

  const changeTokenBtn = () => {
    const tempToken = sellTokenData;
    setSellTokenData(buyTokenData);
    setBuyTokenData(tempToken);
    setSellAmount(0);
    setBuyAmount(0);
    setDirection(1 - direction);
  };

  const selectToken = () => {
    if (sellTokenData === null || sellTokenData === undefined) {
      setSelectTokenState("sell");
    } else if (buyTokenData === null || buyTokenData === undefined) {
      setSelectTokenState("buy");
    }
    setSelectTokenModalState(true);
  };

  const handleTokenSelect = (token: TokenData) => {
    if (selectTokenState === "sell") {
      setSellTokenData(token);
    } else {
      setBuyTokenData(token);
    }
    setSelectTokenModalState(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Swap Tokens</h1>

      <Card className="mb-4 swap-page">
        <CardBody>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Swap</h2>
            <button
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setSlippageModal(true)}
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Sell Section */}
          <div className="mb-4">
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">From</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {sellTokenData &&
                    sellTokenData.id &&
                    sellTokenData.id.length > 0 && <>Balance: {sellBalance}</>}
                </span>
              </div>

              <div
                className={`flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all`}
              >
                <input
                  type="text"
                  id="sellAmount"
                  placeholder="0"
                  value={sellAmount}
                  onChange={handleInputChange}
                  className="flex-grow bg-transparent border-none outline-none text-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 disabled:cursor-not-allowed min-w-0 w-[50%]"
                  inputMode="decimal"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                />

                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => setMax()}
                  >
                    MAX
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-between"
                    onClick={() => {
                      setSelectTokenState("sell");
                      setSelectTokenModalState(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {sellTokenData ? (
                        <>
                          <img
                            src={sellTokenData.img}
                            alt={sellTokenData.text}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                          />
                          <span className="font-medium truncate">
                            {sellTokenData.id}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium truncate">
                          Select token
                        </span>
                      )}
                    </span>
                    <ChevronDown size={16} className="flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {sellAmount !== 0 ? `≈ $${sellAmount} USD` : ''}
          </div>
          {/* {exceedsToken0Balance && (
            <div className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertTriangle size={14} />
              Amount exceeds your balance
            </div>
          )} */}

          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={() => {
                changeTokenBtn();
              }}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>

          {/* Buy Section */}

          <div className="mb-2">
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">To</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {buyTokenData &&
                    buyTokenData.id &&
                    buyTokenData.id.length > 0 && <>Balance: {buyBalance}</>}
                </span>
              </div>

              <div
                className={`flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all`}
              >
                <input
                  type="text"
                  id="buyAmount"
                  placeholder="0"
                  value={buyAmount}
                  onChange={handleInputChange}
                  className="flex-grow bg-transparent border-none outline-none text-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 disabled:cursor-not-allowed min-w-0 w-[50%]"
                  inputMode="decimal"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                />

                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-between"
                    onClick={() => {
                      setSelectTokenState("buy");
                      setSelectTokenModalState(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {buyTokenData ? (
                        <>
                          <img
                            src={buyTokenData.img}
                            alt={buyTokenData.text}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                          />
                          <span className="font-medium truncate">
                            {buyTokenData.id}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium truncate">
                          Select token
                        </span>
                      )}
                    </span>
                    <ChevronDown size={16} className="flex-shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {buyAmount !== 0 ? `≈ $${buyAmount} USD` : ''}
          </div>

          {sellTokenData && buyTokenData && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              1 {sellTokenData.symbol} = {buyAmount / sellAmount}{" "}
              {buyTokenData.symbol}
            </div>
          )}

          {sellTokenData && buyTokenData && poolAddr === null && (
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
          <SwapDetailsNew
            slippage={slippage}
            minimumReceived={minimumReceived}
            lpFee={lpFee}
          />

          {sellTokenData?.id === undefined ||
            sellTokenData?.id === null ||
            buyTokenData?.id === undefined ||
            buyTokenData?.id === null ? (
            wallet.publicKey ? (
              <Button fullWidth size="lg" onClick={() => selectToken()}>
                Select Token
              </Button>
            ) : (
              <WalletButton />
            )
          ) : sellAmount === 0 && buyAmount === 0 ? (
            <Button fullWidth size="lg" className="cursor-not-allowed">
              Enter Amount
            </Button>
          ) : poolAddr === null ? (
            <Button fullWidth size="lg" className="cursor-not-allowed">
              There is no pool for this swap.
            </Button>
          ) : (
            <Button
              fullWidth
              size="lg"
              className={`${sellBalance === 0 || isCalculating
                  ? "bg-gray-800 cursor-not-allowed"
                  : "bg-[#87EFAC] hover:bg-[#6EE79D]"
                } `}
              onClick={
                sellBalance === 0 && swapAvailable
                  ? undefined
                  : () => handleSwap(sellAmount)
              }
              disabled={sellBalance === 0 || isCalculating}
            >
              {isCalculating ? (
                <div className="flex items-center gap-2">
                  <span>Loading</span>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sellBalance === 0 ? (
                "No Tokens on Wallet"
              ) : (
                "Swap"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>

      {selectTokenModalState && (
        <SelectTokenModal
          selectState={selectTokenState}
          onSelect={handleTokenSelect}
          onClose={() => setSelectTokenModalState(false)}
        />
      )}

      {slippageModal && (
        <SettingModal
          slippage={slippage}
          setSlippage={setSlippage}
          transactionDeadline={transactionDeadline}
          setTransactionDeadline={setTransactionDeadline}
          slippagePreset={slippagePreset}
          setSlippagePreset={setSlippagePreset}
          expertMode={expertMode}
          setExpertMode={setExpertMode}
          onClose={() => setSlippageModal(false)}
        />
      )}
    </div>
  );
};

export default Swap;
