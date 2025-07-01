"use client";
import UserContext from "../context/UserContext";
import { getTokenDecimals } from "../program/utils";
import {
  deposit,
  getLpMint,
  getSwapOut,
  getTokenBalance,
  getPoolAddress,
} from "../program/web3";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AlertTriangle, ChevronDown, Info } from "lucide-react";
import React, { ChangeEvent, useContext, useEffect, useState } from "react";
import PoolModal from "../components/modals/PoolModal";
import SelectTokenModal from "../components/modals/SelectTokenModal";
import Button from "../components/ui/Button";
import Card, { CardBody, CardFooter } from "../components/ui/Card";
import { useTransactionNotifications } from "../context/TransactionContext";
import { PoolData, TokenData } from "../types";
import { calculateLpAmountForDeposit } from "../utils/getLpOutAmount";
import { getPoolList } from "../utils/getPoolList";

const Deposit: React.FC = () => {
  const wallet = useWallet();
  const { isLoading, setIsLoading } = useContext(UserContext);
  const [quoteTokenData, setQuoteTokenData] = useState<TokenData | null>(null);
  const [baseTokenData, setBaseTokenData] = useState<TokenData | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [lpAmount, setLpAmount] = useState<number>(0);
  const [selectTokenModalState, setSelectTokenModalState] = useState(false);
  const [selectTokenState, setSelectTokenState] = useState<"quote" | "base">("quote");
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [quoteBalance, setQuoteBalance] = useState<number>(0);
  const [baseBalance, setBaseBalance] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const exceedsToken0Balance = Number(quoteAmount) > quoteBalance;
  const exceedsToken1Balance = Number(baseAmount) > baseBalance;
  const { showNotification } = useTransactionNotifications();

  const fetchBalance = async () => {
    if (wallet.publicKey && quoteTokenData) {
      const sellBal = await getTokenBalance(
        wallet.publicKey.toBase58(),
        quoteTokenData.address
      );
      console.log("Sell balance: ", sellBal);
      setQuoteBalance(sellBal);
    }
    if (wallet.publicKey && baseTokenData) {
      const buyBal = await getTokenBalance(
        wallet.publicKey.toBase58(),
        baseTokenData.address
      );
      console.log("Buy balance: ", buyBal);
      setBaseBalance(buyBal);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [wallet.publicKey, quoteTokenData, baseTokenData]);

  // Fetch pools on component mount
  useEffect(() => {
    const fetchPools = async () => {
      try {
        const poolList = await getPoolList();
        setPools(poolList);

        // Check URL for pool parameter and select the pool if it exists
        const urlParams = new URLSearchParams(window.location.search);
        const poolAddress = urlParams.get('pool');
        if (poolAddress) {
          const poolFromUrl = poolList.find(pool => pool.address === poolAddress);
          if (poolFromUrl) {
            handlePoolSelect(poolFromUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching pools:", error);
      }
    };

    fetchPools();
    setIsLoading(false);
  }, []);

  const calculateLpAmount = async (quoteAmount: number, baseAmount: number) => {
    if (
      !quoteTokenData ||
      !baseTokenData ||
      !selectedPool ||
      quoteAmount <= 0 ||
      baseAmount <= 0
    ) {
      setLpAmount(0);
      return;
    }

    setIsCalculating(true);
    try {
      const quoteDecimal = await getTokenDecimals(quoteTokenData.address);
      const baseDecimal = await getTokenDecimals(baseTokenData.address);
      const lpMint = await getLpMint(
        wallet,
        quoteTokenData.address,
        baseTokenData.address
      );
      // const lpDecimal = await getTokenDecimals(lpMint.toBase58());
      const lpDecimal = lpMint
        ? await getTokenDecimals(lpMint.toBase58())
        : null;

      // Calculate LP amount based on the ratio of input amounts to pool reserves
      const poolQuoteAmount = Number(selectedPool.token1?.amount || "0");
      const poolBaseAmount = Number(selectedPool.token0?.amount || "0");
      const totalLpSupply = Number(selectedPool.liquidity || "0");

      if (poolQuoteAmount > 0 && poolBaseAmount > 0 && totalLpSupply > 0) {
        const quoteRatio =
          (quoteAmount * Math.pow(10, quoteDecimal)) / poolQuoteAmount;
        const baseRatio =
          (baseAmount * Math.pow(10, baseDecimal)) / poolBaseAmount;
        const minRatio = Math.min(quoteRatio, baseRatio);
        const calculatedLpAmount = minRatio * totalLpSupply;
        setLpAmount(calculatedLpAmount / Math.pow(10, lpDecimal));
      } else {
        setLpAmount(0);
      }
    } catch (error) {
      console.error("Error calculating LP amount:", error);
      setLpAmount(0);
      setIsCalculating(false);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const numericValue = parseFloat(value);

    // Validate input
    if (value !== "" && (isNaN(numericValue) || numericValue < 0)) {
      setErrorMessage("Please enter a valid positive number");
      return;
    }

    if (id === "quoteAmount") {
      // Check for exceeding balance
      if (numericValue > quoteBalance) {
        setErrorMessage(`Amount exceeds your ${quoteTokenData?.id} balance of ${quoteBalance}`);
        setQuoteAmount(quoteBalance);
        return;
      }

      setQuoteAmount(numericValue);
      setErrorMessage("");

      // Calculate the related base amount
      if (selectedPool && quoteTokenData && baseTokenData) {
        setIsCalculating(true);
        try {
          const result = await getSwapOut(
            wallet,
            quoteTokenData.address,
            baseTokenData.address,
            new PublicKey(selectedPool.address),
            numericValue
          );
          setBaseAmount(result);

          // Update the LP token calculation
          await calculateLpAmount(numericValue, result || 0);
        } catch (error) {
          console.error("Error calculating base amount:", error);
          setErrorMessage("Failed to calculate base token amount. Please try again.");
        } finally {
          setIsCalculating(false);
        }
      }
    } else if (id === "baseAmount") {
      // Check for exceeding balance
      if (numericValue > baseBalance) {
        setErrorMessage(`Amount exceeds your ${baseTokenData?.id} balance of ${baseBalance}`);
        setBaseAmount(baseBalance);
        return;
      }

      setBaseAmount(numericValue);
      setErrorMessage("");

      // Calculate the related quote amount
      if (selectedPool && quoteTokenData && baseTokenData) {
        setIsCalculating(true);
        try {
          const result = await getSwapOut(
            wallet,
            baseTokenData.address,
            quoteTokenData.address,
            new PublicKey(selectedPool.address),
            numericValue
          );
          setQuoteAmount(result);

          // Update the LP token calculation
          await calculateLpAmount(result || 0, numericValue);
        } catch (error) {
          console.error("Error calculating quote amount:", error);
          setErrorMessage("Failed to calculate quote token amount. Please try again.");
        } finally {
          setIsCalculating(false);
        }
      }
    }
  };

  const selectToken = () => {
    if (quoteTokenData === null || quoteTokenData === undefined) {
      setSelectTokenState("quote");
    } else if (baseTokenData === null || baseTokenData === undefined) {
      setSelectTokenState("base");
    }
    setSelectTokenModalState(true);
  };

  const handleTokenSelect = async (token: TokenData) => {
    if (selectTokenState === "base") {
      setBaseTokenData(token);
    } else {
      setQuoteTokenData(token);
    }
    setSelectTokenModalState(false);

    // Only proceed with pool selection if we have both tokens
    const newQuoteToken = selectTokenState === "quote" ? token : quoteTokenData;
    const newBaseToken = selectTokenState === "base" ? token : baseTokenData;

    if (newQuoteToken && newBaseToken) {
      try {
        const poolAddress = await getPoolAddress(
          wallet,
          newQuoteToken.address,
          newBaseToken.address
        );

        if (poolAddress) {
          const selectedPool = pools.find(
            (pool) => pool.address === poolAddress.toString()
          );
          if (selectedPool) {
            setSelectedPool(selectedPool);
            // Reset amounts when pool is selected
            setBaseAmount(0);
            setQuoteAmount(0);
            setErrorMessage("");
          } else {
            setErrorMessage("No matching pool found for these tokens");
          }
        }
      } catch (error) {
        console.error("Error getting pool address:", error);
        setErrorMessage("Failed to find matching pool");
      }
    }
  };

  const handlePoolSelect = (pool: PoolData) => {
    if (!pool.token0 || !pool.token1) {
      setErrorMessage("Invalid pool data");
      return;
    }

    setSelectedPool(pool);
    setShowPoolModal(false);
    setErrorMessage("");

    const newUrl = `${window.location.pathname}?pool=${pool.address}`;
    window.history.pushState({}, '', newUrl);

    // Set tokens based on selected pool
    setQuoteTokenData({
      id: pool.token1.symbol,
      text: pool.token1.name,
      img: pool.token1.image,
      address: pool.token1.address,
      name: pool.token1.name,
      symbol: pool.token1.symbol,
    });

    setBaseTokenData({
      id: pool.token0.symbol,
      text: pool.token0.name,
      img: pool.token0.image,
      address: pool.token0.address,
      name: pool.token0.name,
      symbol: pool.token0.symbol,
    });

    // Reset amounts when pool is selected
    setBaseAmount(0);
    setQuoteAmount(0);
  };

  const handleDeposite = async (
    address0: string,
    address1: string,
    quoteAmount: number,
    baseAmount: number
  ) => {
    if (!wallet.publicKey) {
      setErrorMessage("Please connect your wallet first");
      return;
    }

    if (!quoteTokenData || !baseTokenData) {
      setErrorMessage("Please select both tokens first");
      return;
    }

    if (quoteAmount <= 0 || baseAmount <= 0) {
      setErrorMessage("Please enter valid amounts for both tokens");
      return;
    }

    if (quoteAmount > quoteBalance) {
      setErrorMessage(`Insufficient ${quoteTokenData.id} balance`);
      return;
    }

    if (baseAmount > baseBalance) {
      setErrorMessage(`Insufficient ${baseTokenData.id} balance`);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      showNotification('processing', 'Sending transaction...');
      const poolAddress = selectedPool?.address;

      if (!poolAddress) {
        setErrorMessage("Failed to find pool address");
        return;
      }

      const quoteDecimal = await getTokenDecimals(address0);
      const baseDecimal = await getTokenDecimals(address1);

      // Get LP mint address
      const lpMint = await getLpMint(wallet, address0, address1);
      if (!lpMint) {
        setErrorMessage("Failed to get LP mint address");
        return;
      }

      // Convert amounts to raw values with proper decimal scaling
      const quoteAmountRaw = Math.floor(quoteAmount * Math.pow(10, quoteDecimal));
      const baseAmountRaw = Math.floor(baseAmount * Math.pow(10, baseDecimal));

      let result;
      if (address0 < address1) {
        const { lpAmount, token0Amount, token1Amount } = await calculateLpAmountForDeposit(
          wallet,
          quoteAmountRaw,
          baseAmountRaw,
          new PublicKey(poolAddress)
        );
        result = await deposit(
          wallet,
          token0Amount,
          token1Amount,
          lpAmount,
          new PublicKey(poolAddress)
        );
      } else {
        const { lpAmount, token0Amount, token1Amount } = await calculateLpAmountForDeposit(
          wallet,
          baseAmountRaw,
          quoteAmountRaw,
          new PublicKey(poolAddress)
        );
        result = await deposit(
          wallet,
          token0Amount,
          token1Amount,
          lpAmount,
          new PublicKey(poolAddress)
        );
      }
      if (result instanceof WalletSignTransactionError) {
        showNotification('error', 'Transaction was not signed. Please try again.');
        return;
      }
      if (result && typeof result === 'object' && 'txid' in result) {
        showNotification('success', 'Transaction confirmed!', result.txid as string);
        setQuoteAmount(0);
        setBaseAmount(0);
        setErrorMessage("");
      } else {
        showNotification('error', `Deposit failed: ${result}`);
      }
    } catch (error) {
      console.error("Deposit error:", error);
      if (error instanceof WalletSignTransactionError) {
        showNotification('error', 'Transaction was not signed. Please try again.');
      } else {
        showNotification('error', 'Deposit failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const setMaxQuote = async () => {
    setQuoteAmount(quoteBalance);

    if (selectedPool && quoteTokenData && baseTokenData) {
      setIsCalculating(true);
      try {
        const result = await getSwapOut(
          wallet,
          quoteTokenData.address,
          baseTokenData.address,
          new PublicKey(selectedPool.address),
          quoteBalance
        );
        setBaseAmount(result);

        // Update the LP token calculation with maximum quote and calculated base amounts
        await calculateLpAmount(quoteBalance, result || 0);
      } catch (error) {
        console.error("Error calculating base amount on Max:", error);
        setErrorMessage("Failed to calculate base token amount for Max. Please try again.");
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const setMaxBase = async () => {
    setBaseAmount(baseBalance);

    if (selectedPool && quoteTokenData && baseTokenData) {
      setIsCalculating(true);
      try {
        const result = await getSwapOut(
          wallet,
          baseTokenData.address,
          quoteTokenData.address,
          new PublicKey(selectedPool.address),
          baseBalance
        );
        setQuoteAmount(result);

        // Update the LP token calculation with maximum base and calculated quote amounts
        await calculateLpAmount(result || 0, baseBalance);
      } catch (error) {
        console.error("Error calculating quote amount on Max:", error);
        setErrorMessage("Failed to calculate quote token amount for Max. Please try again.");
      } finally {
        setIsCalculating(false);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Deposit Liquidity</h1>
      <Card className="mb-4">
        <CardBody>
          {errorMessage && (
            <div className="text-sm text-red-500 flex items-center gap-1 mb-4">
              <AlertTriangle size={14} />
              {errorMessage}
            </div>
          )}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Select Tokens</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Choose the token pair you want to provide liquidity for
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  First Token
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {quoteTokenData &&
                    quoteTokenData.id &&
                    quoteTokenData.id.length > 0 && (
                      <>Balance: {quoteBalance}</>
                    )}
                </span>
              </div>

              <div
                className={`flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all`}
              >
                <input
                  type="text"
                  id="quoteAmount"
                  placeholder="0"
                  value={quoteAmount}
                  onChange={handleInputChange}
                  className="flex-grow bg-transparent border-none outline-none text-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 disabled:cursor-not-allowed min-w-0 w-[50%]"
                  inputMode="decimal"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  disabled={!quoteTokenData}
                />

                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setMaxQuote()}
                  >
                    MAX
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-between"
                    onClick={() => {
                      setSelectTokenState("quote");
                      setSelectTokenModalState(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {quoteTokenData ? (
                        <>
                          <img
                            src={quoteTokenData.img}
                            alt={quoteTokenData.text}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                          />
                          <span className="font-medium truncate">
                            {quoteTokenData.id}
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
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {quoteAmount !== 0 ? `≈ $${quoteAmount} USD` : ""}
            </div>
            {exceedsToken0Balance && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle size={14} />
                Amount exceeds your balance
              </div>
            )}

            <div className="w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">
                  Second Token
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {baseTokenData &&
                    baseTokenData.id &&
                    baseTokenData.id.length > 0 && <>Balance: {baseBalance}</>}
                </span>
              </div>

              <div
                className={`flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all`}
              >
                <input
                  type="text"
                  id="baseAmount"
                  placeholder="0"
                  value={baseAmount}
                  onChange={handleInputChange}
                  className="flex-grow bg-transparent border-none outline-none text-xl font-medium text-gray-900 dark:text-white placeholder-gray-400 disabled:cursor-not-allowed min-w-0 w-[50%]"
                  inputMode="decimal"
                  pattern="^[0-9]*[.,]?[0-9]*$"
                  disabled={!baseTokenData}
                />

                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setMaxBase()}
                  >
                    MAX
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-1 px-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-between"
                    onClick={() => {
                      setSelectTokenState("base");
                      setSelectTokenModalState(true);
                    }}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      {baseTokenData ? (
                        <>
                          <img
                            src={baseTokenData.img}
                            alt={baseTokenData.text}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                          />
                          <span className="font-medium truncate">
                            {baseTokenData.id}
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
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {baseAmount !== 0 ? `≈ $${baseAmount} USD` : ""}
            </div>
            {exceedsToken1Balance && (
              <div className="text-sm text-red-500 flex items-center gap-1">
                <AlertTriangle size={14} />
                Amount exceeds your balance
              </div>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <button
              onClick={() => setShowPoolModal(true)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {quoteTokenData?.id && baseTokenData?.id
                      ? "Selected Pool"
                      : "Select Pool"}
                  </div>
                  <div className="font-medium flex items-center">
                    {quoteTokenData?.id && baseTokenData?.id ? (
                      <>
                        <div className="flex -space-x-2 mr-3">
                          <img
                            src={quoteTokenData?.img}
                            alt={quoteTokenData?.symbol}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                          />
                          <img
                            src={baseTokenData?.img}
                            alt={baseTokenData?.symbol}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                          />
                        </div>
                        {`${quoteTokenData.id}/${baseTokenData.id}`}
                      </>
                    ) : (
                      "View all pools"
                    )}
                  </div>
                </div>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
              {quoteTokenData?.id && baseTokenData?.id && selectedPool ? (
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  APR: %
                </div>
              ) : null}
            </button>
          </div>
        </CardBody>
        <CardFooter>
          <div className="space-y-3 w-full">
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                Network Fee <Info size={14} />
              </div>
              <div>~0.0005 SOL</div>
            </div>

            {!quoteTokenData?.address || !baseTokenData?.address ? (
              <Button
                fullWidth
                size="lg"
                className="w-full flex justify-center items-center py-4 rounded-xl text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                disabled
              >
                Select Pool
              </Button>
            ) : (
              <Button
                fullWidth
                size="lg"
                className={`w-full flex justify-center items-center py-4 rounded-xl text-white h-14 transition-colors ${
                  isCalculating || exceedsToken0Balance || exceedsToken1Balance
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#87EFAC] hover:bg-[#6EE79D]"
                }`}
                onClick={() =>
                  !isCalculating &&
                  !exceedsToken0Balance &&
                  !exceedsToken1Balance &&
                  quoteTokenData?.address &&
                  baseTokenData?.address &&
                  handleDeposite(
                    quoteTokenData.address,
                    baseTokenData.address,
                    quoteAmount,
                    baseAmount
                  )
                }
                disabled={isCalculating || exceedsToken0Balance || exceedsToken1Balance || isLoading || !quoteTokenData?.address || !baseTokenData?.address || baseAmount === 0 || quoteAmount === 0}
              >
                {isCalculating ? (
                  <div className="flex items-center gap-2">
                    <span>Loading</span>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : exceedsToken0Balance || exceedsToken1Balance ? (
                  "Insufficient Balance"
                ) : isLoading ? (
                  "Adding Liquidity..."
                ) : !quoteTokenData?.address || !baseTokenData?.address ? (
                  "Select Tokens"
                ) : baseAmount === 0 && quoteAmount === 0 ? (
                  "Enter amounts"
                ) : (
                  "Add Liquidity"
                )}
              </Button>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Prices and pool ratios are subject to change based on market
              conditions.
            </p>
          </div>
        </CardFooter>
      </Card>

      {selectTokenModalState && (
        <SelectTokenModal
          selectState={selectTokenState}
          onSelect={handleTokenSelect}
          onClose={() => setSelectTokenModalState(false)}
        />
      )}

      {showPoolModal && (
        <PoolModal
          pools={pools}
          onSelect={handlePoolSelect}
          onClose={() => setShowPoolModal(false)}
        />
      )}
    </div>
  );
};

export default Deposit;
