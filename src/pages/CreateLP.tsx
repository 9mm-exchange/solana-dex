"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import React, { ChangeEvent, useCallback, useContext, useEffect, useState } from "react";
import { createPool, getTokenBalance } from "../program/web3";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletSignTransactionError } from "@solana/wallet-adapter-base";
import { ChevronDown, Info, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LiquidityInfoSection from "../components/LiquidityInfoSection";
import SelectTokenModal from "../components/modals/SelectTokenModal";
import PoolExistsWarning from "../components/PoolExistsWarning";
import PoolInfoCard from "../components/PoolInfoCard";
import Button from "../components/ui/Button";
import Card, { CardBody, CardFooter } from "../components/ui/Card";
import { useTransactionNotifications } from "../context/TransactionContext";
import UserContext from "../context/UserContext";
import { checkTokenStandard, getTokenDecimals } from "../program/utils";
import { getPoolAddress } from "../program/web3";
import { TokenData, PoolData } from "../types";
import { getPoolList } from "../utils/getPoolList";

interface CreatePoolResponse {
  res: string;
  lpMint: PublicKey;
  poolAddress: PublicKey;
}

const CreateLP: React.FC = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { isLoading, setIsLoading } = useContext(UserContext);
  const [quoteTokenData, setQuoteTokenData] = useState<TokenData | null>(null);
  const [baseTokenData, setBaseTokenData] = useState<TokenData | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [selectTokenModalState, setSelectTokenModalState] = useState(false);
  const [selectTokenState, setSelectTokenState] = useState<"quote" | "base">(
    "quote"
  );
  const [quoteBalance, setQuoteBalance] = useState<number>(0);
  const [baseBalance, setBaseBalance] = useState<number>(0);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [checkPoolExist, setCheckPoolExist] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { showNotification } = useTransactionNotifications();
  const [existPoolAddress, setExistPoolAddress] = useState<string>("");

  function calculateTotalUSD(amount0: number, amount1: number): number {
    return amount0 + amount1;
  }

  const totalValueUSD: number = calculateTotalUSD(quoteBalance, baseBalance);

  const fetchBalance = async () => {
    if (!wallet.publicKey) return;

    try {
      if (quoteTokenData) {
        const sellBal = await getTokenBalance(
          wallet.publicKey.toBase58(),
          quoteTokenData.address
        );
        setQuoteBalance(sellBal);
      }
      if (baseTokenData) {
        const buyBal = await getTokenBalance(
          wallet.publicKey.toBase58(),
          baseTokenData.address
        );
        setBaseBalance(buyBal);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
      setErrorMessage("Failed to fetch token balances");
    }
  };

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const poolList = await getPoolList();
        setPools(poolList);
      } catch (error) {
        console.error("Error fetching pools:", error);
      }
    };

    fetchPools();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      fetchBalance();

      if (
        quoteTokenData &&
        baseTokenData &&
        quoteTokenData.address === baseTokenData.address
      ) {
        setErrorMessage("Cannot create a pool with the same token");
        setBaseTokenData(null);
        return; // Exit early as it's an invalid state
      }

      if (
        quoteTokenData &&
        baseTokenData &&
        quoteTokenData.address &&
        baseTokenData.address
      ) {
        try {
          const poolAddr = await getPoolAddress(
            wallet,
            quoteTokenData.address,
            baseTokenData.address
          );

          // Ensure pools is an array of objects and compare using the address
          const checkExistPool = pools.filter(
            (pool) => pool.address === poolAddr.toBase58()
          );

          if (checkExistPool.length > 0) {
            setCheckPoolExist(true);
            setExistPoolAddress(poolAddr.toBase58());
          } else {
            const poolAddr = await getPoolAddress(
              wallet,
              baseTokenData.address,
              quoteTokenData.address
            );
            const checkExistPool = pools.filter(
              (pool) => pool.address === poolAddr.toBase58()
            );
            if (checkExistPool.length > 0) {
              setCheckPoolExist(true);
              setExistPoolAddress(poolAddr.toBase58());
            } else {
              setCheckPoolExist(false);
            }
          }
        } catch (error) {
          console.error("Error retrieving pool address:", error);
        }
      }
    };

    fetchData(); // Call the async function
  }, [wallet.publicKey, quoteTokenData, baseTokenData, pools]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const numericValue = Number(value);

    if (!isNaN(numericValue) && numericValue >= 0) {
      if (id === "quoteAmount") {
        if (numericValue > quoteBalance) {
          setErrorMessage(`Amount exceeds your ${quoteTokenData?.id} balance of ${quoteBalance}`);
          setQuoteAmount(quoteBalance);
        } else {
          setQuoteAmount(numericValue);
          setErrorMessage("");
        }
      } else if (id === "baseAmount") {
        if (numericValue > baseBalance) {
          setErrorMessage(`Amount exceeds your ${baseTokenData?.id} balance of ${baseBalance}`);
          setBaseAmount(baseBalance);
        } else {
          setBaseAmount(numericValue);
          setErrorMessage("");
        }
      }
    } else if (value !== "") {
      setErrorMessage("Please enter a valid number");
    }
  };

  const handleMaxQuote = () => {
    setQuoteAmount(quoteBalance);
  };

  const handleMaxBase = () => {
    setBaseAmount(baseBalance);
  };

  const selectToken = () => {
    if (!quoteTokenData) {
      setSelectTokenState("quote");
    } else if (!baseTokenData) {
      setSelectTokenState("base");
    }
    setSelectTokenModalState(true);
  };

  const handleTokenSelect = async (token: TokenData) => {
    if (selectTokenState === "quote") {
      setQuoteTokenData(token);
    } else {
      setBaseTokenData(token);
    }
    setSelectTokenModalState(false);
  };

  const handleCreatepool = async () => {
    if (!wallet.publicKey) {
      setErrorMessage("Please connect wallet");
      return;
    }

    if (!quoteTokenData || !baseTokenData) {
      setErrorMessage("Please select both tokens");
      return;
    }

    if (quoteAmount <= 0 || baseAmount <= 0) {
      setErrorMessage("Please enter valid amounts");
      return;
    }

    if (quoteAmount > quoteBalance) {
      setErrorMessage(`Quote amount exceeds balance`);
      return;
    }

    if (baseAmount > baseBalance) {
      setErrorMessage(`Base amount exceeds balance`);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      showNotification('processing', 'Sending transaction...');
      const quoteDecimal = await getTokenDecimals(quoteTokenData.address);
      const baseDecimal = await getTokenDecimals(baseTokenData.address);
      const quoteStandard = await checkTokenStandard(quoteTokenData.address);
      console.log("🚀 ~ handleCreatepool ~ quoteStandard:", quoteStandard?.toBase58())
      const baseStandard = await checkTokenStandard(baseTokenData.address);
      console.log("🚀 ~ handleCreatepool ~ baseStandard:", baseStandard?.toBase58())

      if ((
        quoteStandard === TOKEN_2022_PROGRAM_ID &&
        baseStandard === TOKEN_2022_PROGRAM_ID
      ) || (quoteStandard === TOKEN_PROGRAM_ID && baseStandard === TOKEN_PROGRAM_ID)) {
        setErrorMessage("One token should be a TOKEN-2022 token!");
        return;
      }

      if (!quoteStandard || !baseStandard) {
        setErrorMessage("Token standards are missing");
        return;
      }

      let res: CreatePoolResponse | null = null;

      // Ensure quote token address is always smaller than base token address
      const quoteAddress = new PublicKey(quoteTokenData.address);
      const baseAddress = new PublicKey(baseTokenData.address);

      console.log("Quote token address:", quoteAddress.toBase58());
      console.log("Base token address:", baseAddress.toBase58());

      if (quoteAddress.toBase58() < baseAddress.toBase58()) {
        // Original order is correct
        res = (await createPool(
          wallet,
          quoteAddress,
          baseAddress,
          quoteAmount * Math.pow(10, quoteDecimal),
          baseAmount * Math.pow(10, baseDecimal),
          quoteStandard,
          baseStandard
        )) as CreatePoolResponse;
      } else {
        // Need to swap the order
        res = (await createPool(
          wallet,
          baseAddress,
          quoteAddress,
          baseAmount * Math.pow(10, baseDecimal),
          quoteAmount * Math.pow(10, quoteDecimal),
          baseStandard,
          quoteStandard
        )) as CreatePoolResponse;
      }

      if (res && typeof res === 'object' && 'res' in res && res.res instanceof WalletSignTransactionError) {
        showNotification('error', 'Transaction was not signed. Please try again.');
        return;
      }

      // Check if the response is valid
      if (!res || !res.res || !res.lpMint || !res.poolAddress) {
        showNotification('error', 'Failed to create pool', res?.res);
        setErrorMessage("Failed to create pool");
        return;
      }

      // If we get here, the transaction was successful
      showNotification('success', 'Pool created successfully!', res.res);
      // Reset form
      setQuoteAmount(0);
      setBaseAmount(0);
      setQuoteTokenData(null);
      setBaseTokenData(null);
      setErrorMessage("");
    } catch (error) {
      console.error("Create pool error:", error);
      showNotification('error', 'Failed to create pool', error instanceof Error ? error.message : 'Unknown error');

    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigateToDeposit = useCallback(() => {
    if (quoteTokenData && baseTokenData) {
      navigate(`/deposit?pool=${existPoolAddress}`);
    }
  }, [quoteTokenData, baseTokenData, navigate, existPoolAddress]);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Liquidity Pool</h1>

      <Card className="mb-6">
        <CardBody>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Create Pool</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {checkPoolExist
                ? "This pool already exists. You can deposit liquidity instead."
                : "Create a new liquidity pool or add to an existing one to earn trading fees."}
            </p>
          </div>

          {/* Quote Section */}
          <div className="mb-6">
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
                />

                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => handleMaxQuote()}
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
          </div>

          {/* Base Section */}
          <div className="mb-6">
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
                />

                <div className="flex items-center gap-2 ml-2">
                  <button
                    type="button"
                    className="text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => handleMaxBase()}
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
          </div>

          <PoolInfoCard
            token0={quoteTokenData}
            token1={baseTokenData}
            amount0={quoteBalance}
            amount1={baseBalance}
            totalValueUSD={totalValueUSD}
            poolExists={checkPoolExist}
          />

          {checkPoolExist && (
            <PoolExistsWarning
              token0={quoteTokenData}
              token1={baseTokenData}
              onNavigate={handleNavigateToDeposit}
            />
          )}
        </CardBody>

        <CardFooter>
          <div className="space-y-3 w-full">
            {errorMessage && (
              <div className="text-sm text-red-500 flex items-center gap-1 mb-4">
                <AlertTriangle size={14} />
                {errorMessage}
              </div>
            )}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                LP Fee <Info size={14} />
              </div>
              <div>0.3%</div>
            </div>

            {!baseTokenData?.id || !quoteTokenData?.id ? (
              <Button
                fullWidth
                size="lg"
                onClick={selectToken}
                className="w-full flex justify-center items-center mt-4 py-4 rounded-xl text-white bg-gray-800 h-14 hover:bg-gray-700 transition-colors"
              >
                Select Tokens
              </Button>
            ) : (
              <Button
                fullWidth
                size="lg"
                className={`w-full flex justify-center items-center mt-4 py-4 rounded-xl  h-14 transition-colors ${checkPoolExist
                  ? "bg-gray-600 hover:bg-gray-700 text-white"
                  : "bg-[#87EFAC] hover:bg-[#6EE79D] text-black"
                  }`}
                onClick={() => {
                  if (!checkPoolExist) handleCreatepool();
                }}
                disabled={checkPoolExist || isLoading}
              >
                {checkPoolExist ? "Already exist pool" : isLoading ? "Creating pool..." : "Create pool"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">
            About Liquidity Provision
          </h2>
          <LiquidityInfoSection />
        </CardBody>
      </Card>
      {selectTokenModalState && (
        <SelectTokenModal
          selectState={selectTokenState}
          onSelect={handleTokenSelect}
          onClose={() => setSelectTokenModalState(false)}
        />
      )}
    </div>
  );
};

export default CreateLP;
