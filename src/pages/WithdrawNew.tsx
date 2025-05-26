"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ChevronDown } from "lucide-react";
import React, { ChangeEvent, useContext, useEffect, useState } from "react";
import PositionModal from "../components/modals/PositionModal";
import SelectTokenModal from "../components/modals/SelectTokenModal";
import Button from "../components/ui/Button";
import Card, { CardBody, CardFooter } from "../components/ui/Card";
import {
  errorAlert,
  warningAlert
} from "../components/ui/ToastGroup";
import WarningAlert from "../components/ui/WarningAlert";
import { useTransactionNotifications } from "../context/TransactionContext";
import UserContext from "../context/UserContext";
import { getTokenDecimals } from "../program/utils";
import { getLpMint, getTokenBalance, withdraw } from "../program/web3";
import { PositionData, TokenData } from "../types";
import { getPoolList } from "../utils/getPoolList";

const WithdrawLPNew: React.FC = () => {
  const wallet = useWallet();
  const { isLoading, setIsLoading } = useContext(UserContext);
  const [token0Data, settoken0Data] = useState<TokenData | null>(null);
  const [token1Data, setToken1Data] = useState<TokenData | null>(null);
  const [lpTokenData, setLpTokenData] = useState<TokenData | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [lpTokenAmount, setlpTokenAmount] = useState<number>(0);
  const [selectTokenModalState, setSelectTokenModalState] = useState(false);
  const [selectTokenState, setSelectTokenState] = useState<"quote" | "base">("quote");
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionData | null>(null);
  const [quoteBalance, setQuoteBalance] = useState<number>(0);
  const [baseBalance, setBaseBalance] = useState<number>(0);
  const [lpBalance, setLpBalance] = useState<number>(0);
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [checkPosition, setCheckPosition] = useState<boolean>(true);
  const { showNotification } = useTransactionNotifications();

  const fetchBalance = async () => {
    if (wallet.publicKey && token0Data) {
      const sellBal = await getTokenBalance(
        wallet.publicKey.toBase58(),
        token0Data.address
      );
      console.log("Sell balance: ", sellBal);
      setQuoteBalance(sellBal);
    }
    if (wallet.publicKey && token1Data) {
      const buyBal = await getTokenBalance(
        wallet.publicKey.toBase58(),
        token1Data.address
      );
      console.log("Buy balance: ", buyBal);
      setBaseBalance(buyBal);
    }
    if (wallet.publicKey && token1Data && token0Data) {
      console.log("🚀 ~ fetchBalance ~ token0Data:", token0Data);
      console.log("🚀 ~ fetchBalance ~ token1Data:", token1Data);
      console.log("------------------------");
      const lpMint = await getLpMint(
        wallet,
        token0Data.address,
        token1Data.address
      );
      if (lpMint) {
        const lpBal = await getTokenBalance(
          wallet.publicKey.toBase58(),
          lpMint.toString()
        );
        console.log("lp balance: ", lpBal);
        setLpBalance(lpBal);
        const newLp: TokenData = {
          address: lpMint.toString(),
          id: lpMint.toString().slice(0, 5),
          img: "https://swap.pump.fun/tokens/usde.webp",
          text: "lp",
          name: "LP Token",
          symbol: "LP"
        };
        console.log("🚀 ~ fetchBalance ~ newLp:", newLp);
        setLpTokenData(newLp);
      }
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [wallet.publicKey, token0Data, token1Data, selectedPosition]);

  // Fetch pools on component mount
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const positionList = await getPoolList();
        console.log("🚀 ~ fetchPositions ~ positionList:", positionList);
        // Transform the position list to match the PositionData interface
        const transformedPositions = positionList.map(pool => ({
          ...pool,
          token0: pool.token0 || undefined,
          token1: pool.token1 || undefined,
          vol: pool.vol || '0',
          liquidity: pool.liquidity || '0',
          address: pool.address,
          lpMint: pool.lpMint
        }));
        setPositions(transformedPositions);
      } catch (error) {
        console.error("Error fetching positions:", error);
      }
    };

    fetchPositions();
  }, []);

  useEffect(() => {
    if (!selectedPosition) return;
    const { token0, token1, lpMint } = selectedPosition;
    if (!token0 || !token1 || !lpMint) return;

    settoken0Data({
      id: token0.symbol,
      text: token0.symbol,
      img: token0.image,
      address: token0.address,
      name: token0.name || token0.symbol,
      symbol: token0.symbol
    });
    setToken1Data({
      id: token1.symbol,
      text: token1.symbol,
      img: token1.image,
      address: token1.address,
      name: token1.name || token1.symbol,
      symbol: token1.symbol
    });
    setLpTokenData({
      id: lpMint.toString().slice(0, 5),
      text: "lp",
      img: "https://swap.pump.fun/tokens/usde.webp",
      address: selectedPosition?.lpMint.toString(),
      name: "LP Token",
      symbol: "LP"
    });
  }, [selectedPosition]);

  useEffect(() => {
    if (lpTokenData) {
      console.log("🚀 ~ useEffect ~ lpTokenData:", lpTokenData);
      console.log("🚀 ~ useEffect ~ pools:", positions);
      const lpTokenExist = positions.find(
        (position) => position.lpMint === lpTokenData.address
      );
      console.log("🚀 ~ useEffect ~ lpTokenExist:", lpTokenExist);
      if (lpTokenExist !== undefined) {
        setCheckPosition(false);
      }
    }
  }, [lpTokenData]);

  if (lpBalance < lpTokenAmount) {
    warningAlert("Can't withdraw more than you take");
    setlpTokenAmount(lpBalance);
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const numericValue = Number(value);

    if (!isNaN(numericValue) && numericValue >= 0) {
      if (id === "quoteAmount") {
        setQuoteAmount(numericValue);
      } else if (id === "baseAmount") {
        setBaseAmount(numericValue);
      } else if (id === "lpTokenAmount") {
        setlpTokenAmount(numericValue);
      }
    }
  };

  const selectToken = () => {
    if (token0Data === null || token0Data === undefined) {
      setSelectTokenState("quote");
    } else if (token1Data === null || token1Data === undefined) {
      setSelectTokenState("base");
    }
    setSelectTokenModalState(true);
  };

  const handleTokenSelect = (token: TokenData) => {
    if (selectTokenState === "quote") {
      settoken0Data(token);
    } else {
      setToken1Data(token);
    }
    setSelectTokenModalState(false);
  };

  const handlePositionSelect = (position: PositionData) => {
    if (!position.token0 || !position.token1) {
      errorAlert("Invalid position data");
      return;
    }

    setSelectedPosition(position);
    setShowPositionModal(false);

    // Set tokens based on selected pool
    settoken0Data({
      id: position.token0.symbol,
      text: position.token0.name,
      img: position.token0.image,
      address: position.token0.address,
      name: position.token0.name,
      symbol: position.token0.symbol,
    });

    setToken1Data({
      id: position.token1.symbol,
      text: position.token1.name,
      img: position.token1.image,
      address: position.token1.address,
      name: position.token1.name,
      symbol: position.token1.symbol,
    });

    // Reset amounts when pool is selected
    setBaseAmount(0);
    setQuoteAmount(0);
  };

  const handleWithdraw = async (
    address1: string,
    address2: string,
    lpAmount: number
  ) => {
    if (!wallet.publicKey) {
      errorAlert("Wallet not connected");
      return;
    }

    if (!token0Data?.address || !token1Data?.address) {
      errorAlert("Invalid token data");
      return;
    }

    console.log(
      "handlewithdraw: ",
      address1,
      address2,
      lpAmount
    );
    setIsLoading(true);
    try {
      const quoteDecimal = await getTokenDecimals(address1);
      console.log("🚀 ~ handleCreatepool ~ quoteDecimal:", quoteDecimal);
      const baseDecimal = await getTokenDecimals(address2);
      console.log("🚀 ~ handleCreatepool ~ baseDecimal:", baseDecimal);
      const lpMint = await getLpMint(wallet, address1, address2);
      const lpDecimal = lpMint ? await getTokenDecimals(lpMint.toBase58()) : null;

      if (!lpDecimal) {
        throw new Error("Failed to get LP token decimals");
      }

      showNotification('processing', 'Sending transaction...', 'Please confirm the transaction in your wallet');
      const res = await withdraw(
        wallet,
        new PublicKey(address1),
        new PublicKey(address2),
        0,
        0,
        lpAmount * Math.pow(10, lpDecimal)
      );
      console.log("🚀 ~ handleWithdraw ~ res:", res);

      if (res && typeof res === 'string') {
        showNotification('success', 'Transaction confirmed!', `Transaction hash: ${res.slice(0, 8)}...${res.slice(-8)}`);
        // Reset amounts after successful withdrawal
        setQuoteAmount(0);
        setBaseAmount(0);
        setlpTokenAmount(0);
        // Refresh balances
        await fetchBalance();
      } else {
        showNotification('error', 'Transaction failed', 'Please try again');
      }
    } catch (error) {
      console.error("Withdraw failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      showNotification('error', 'Transaction failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Remove Liquidity</h1>

      <Card className="mb-4">
        <CardBody>
          <div className="w-full mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select a liquidity position
              </span>
              {token0Data?.id && (
                <span className="text-gray-500 dark:text-gray-400">
                  Balance: {lpBalance}
                </span>
              )}
            </div>

            {/* Select a Pool */}
            <div className="w-full">
              <div
                className="mb-4"
                onClick={() => {
                  if (setShowPositionModal) setShowPositionModal(true);
                }}
              >
                <div className="flex flex-row gap-3 items-center justify-start">
                  {!(token0Data?.id && token1Data?.id) && (
                    <button className="w-full p-4 rounded-xl border-2 border-purple-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="text-center text-purple-600 dark:text-purple-400 font-medium">
                        Select a position
                      </div>
                    </button>
                  )}

                  {token0Data?.id && token1Data?.id && (
                    <button className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            <img
                              src={token0Data.img}
                              alt={token0Data.symbol}
                              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                            />
                            <img
                              src={token1Data.img}
                              alt={token1Data.symbol}
                              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                            />
                          </div>
                          <div className="ml-3 text-left">
                            <div className="font-medium">
                              {token0Data.id}/{token1Data.id}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {quoteBalance} {token0Data.id} +
                              {baseBalance} {token1Data.id}
                            </div>
                          </div>
                        </div>
                        <ChevronDown size={20} className="text-gray-500" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
              {token0Data?.id && token1Data?.id && (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount
                      </label>
                      <button
                        onClick={() => {
                          setlpTokenAmount(lpBalance);
                        }}
                        className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-purple-600 dark:text-purple-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        MAX
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        id="lpTokenAmount"
                        value={lpTokenAmount}
                        onChange={handleInputChange}
                        placeholder="0.0"
                        className="w-full p-4 pr-20 text-xl rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:border-purple-500"
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                        LP
                      </div>
                    </div>
                  </div>
                  {lpTokenAmount > 0 && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-sm font-medium mb-3">
                        You will receive:
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {token0Data ? (
                              <>
                                <img
                                  src={token0Data.img}
                                  alt={token0Data.text}
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                                <span>{token0Data.id}</span>
                              </>
                            ) : (
                              <span></span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{quoteAmount}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ≈ $125.75
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {token1Data ? (
                              <>
                                <img
                                  src={token1Data.img}
                                  alt={token1Data.text}
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                                <span>{token1Data.id}</span>
                              </>
                            ) : (
                              <span></span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{baseAmount}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ≈ $125.00
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between font-medium">
                          <span>Total:</span>
                          <span>
                            ≈ $250.75
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="text-sm font-medium mb-2">
                      Prices and pool share
                    </div>

                    <div className="space-y-2 text-sm">
                      {token0Data && token1Data ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {token0Data.id} price:
                            </span>
                            <span>
                              1 {token0Data.id} ={" "}
                              {(
                                token1Data.price! / token0Data.price!
                              ).toFixed(6)}{" "}
                              {token1Data.id}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {token1Data.id} price:
                            </span>
                            <span>
                              1 {token1Data.id} ={" "}
                              {(
                                token0Data.price! / token1Data.price!
                              ).toFixed(6)}{" "}
                              {token0Data.id}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span></span>
                      )}

                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Your pool share:
                        </span>
                        <span>
                          0%
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <WarningAlert />
        </CardBody>
        <CardFooter>
          <div className="space-y-3 w-full">
            {!token0Data?.id || !token1Data?.id ? (
              <Button fullWidth size="lg" disabled>
                Select Position
              </Button>
            ) : lpTokenAmount === 0 ? (
              <Button fullWidth size="lg" disabled>
                Enter amounts
              </Button>
            ) : (
              <Button
                fullWidth
                size="lg"
                onClick={() => {
                  if (
                    token0Data?.address &&
                    token1Data?.address &&
                    lpTokenAmount
                  ) {
                    handleWithdraw(
                      token0Data.address,
                      token1Data.address,
                      lpTokenAmount
                    );
                  } else {
                    errorAlert("Missing token data or amounts");
                  }
                }}
              >
                Remove Liquidity
              </Button>
            )}
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Network Fee</span>
              <span>~0.0005 SOL</span>
            </div>
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

      {showPositionModal && (
        <PositionModal
          positions={positions}
          onSelect={handlePositionSelect}
          onClose={() => setShowPositionModal(false)}
        />
      )}
    </div>
  );
};

export default WithdrawLPNew;
