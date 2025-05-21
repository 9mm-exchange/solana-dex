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
  const [quoteTokenData, setQuoteTokenData] = useState<TokenData | null>(null);
  const [baseTokenData, setBaseTokenData] = useState<TokenData | null>(null);
  const [lpTokenData, setLpTokenData] = useState<TokenData | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<number>(0);
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [lpTokenAmount, setlpTokenAmount] = useState<number>(0);
  const [selectTokenModalState, setSelectTokenModalState] = useState(false);
  const [selectTokenState, setSelectTokenState] = useState<"quote" | "base">(
    "quote"
  );
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<PositionData | null>(
    null
  );
  const [quoteBalance, setQuoteBalance] = useState<number>(0);
  const [baseBalance, setBaseBalance] = useState<number>(0);
  const [lpBalance, setLpBalance] = useState<number>(0);
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [checkPosition, setCheckPosition] = useState<boolean>(true);
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
    if (wallet.publicKey && baseTokenData && quoteTokenData) {
      console.log("🚀 ~ fetchBalance ~ quoteTokenData:", quoteTokenData);
      console.log("🚀 ~ fetchBalance ~ baseTokenData:", baseTokenData);
      console.log("------------------------");
      const lpMint = await getLpMint(
        wallet,
        quoteTokenData.address,
        baseTokenData.address
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
        };
        console.log("🚀 ~ fetchBalance ~ newLp:", newLp);
        setLpTokenData(newLp);
      }
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [wallet.publicKey, quoteTokenData, baseTokenData, selectedPosition]);

  // Fetch pools on component mount
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const positionList = await getPoolList();
        console.log("🚀 ~ fetchPositions ~ positionList:", positionList);
        setPositions(positionList);
      } catch (error) {
        console.error("Error fetching positions:", error);
      }
    };

    fetchPositions();
  }, []);

  useEffect(() => {
    if (!selectedPosition) return;
    const { quoteToken, baseToken, lpMint } = selectedPosition;
    if (!quoteToken || !baseToken || !lpMint) return;

    setQuoteTokenData({
      id: quoteToken.symbol,
      text: quoteToken.symbol,
      img: quoteToken.image,
      address: quoteToken.address,
    });
    setBaseTokenData({
      id: baseToken.symbol,
      text: baseToken.symbol,
      img: baseToken.image,
      address: baseToken.address,
    });
    setLpTokenData({
      id: lpMint.toString().slice(0, 5),
      text: "lp",
      img: "https://swap.pump.fun/tokens/usde.webp",
      address: selectedPosition?.lpMint.toString(),
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
  // useEffect(() => {
  //   if (pools.length > 0) {
  //     const pool = pools.find(pool => pool.lpMint.toString() === lpTokenData?.address);
  //     if (pool) {
  //       setCheckPool(false);
  //     }
  //   }
  // }, [lpTokenData]);

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
    if (quoteTokenData === null || quoteTokenData === undefined) {
      setSelectTokenState("quote");
    } else if (baseTokenData === null || baseTokenData === undefined) {
      setSelectTokenState("base");
    }
    setSelectTokenModalState(true);
  };

  const handleTokenSelect = (token: TokenData) => {
    if (selectTokenState === "quote") {
      setQuoteTokenData(token);
    } else {
      setBaseTokenData(token);
    }
    setSelectTokenModalState(false);
  };

  const handlePositionSelect = (position: PositionData) => {
    if (!position.quoteToken || !position.baseToken) {
      errorAlert("Invalid position data");
      return;
    }

    setSelectedPosition(position);
    setShowPositionModal(false);

    // Set tokens based on selected pool
    setQuoteTokenData({
      id: position.quoteToken.symbol,
      text: position.quoteToken.name,
      img: position.quoteToken.image,
      address: position.quoteToken.address,
      name: position.quoteToken.name,
      symbol: position.quoteToken.symbol,
    });

    setBaseTokenData({
      id: position.baseToken.symbol,
      text: position.baseToken.name,
      img: position.baseToken.image,
      address: position.baseToken.address,
      name: position.baseToken.name,
      symbol: position.baseToken.symbol,
    });

    // Reset amounts when pool is selected
    setBaseAmount(0);
    setQuoteAmount(0);
  };

  const handleWithdraw = async (
    address1: string,
    address2: string,
    amount1: number,
    amount2: number,
    lpAmount: number
  ) => {
    console.log(
      "handlewithdraw: ",
      address1,
      address2,
      amount1,
      amount2,
      lpAmount
    );
    setIsLoading(true);
    const quoteDecimal = await getTokenDecimals(address1);
    console.log("🚀 ~ handleCreatepool ~ quoteDecimal:", quoteDecimal);
    const baseDecimal = await getTokenDecimals(address2);
    console.log("🚀 ~ handleCreatepool ~ baseDecimal:", baseDecimal);
    const lpMint = await getLpMint(wallet, address1, address2);
    // const lpDecimal = await getTokenDecimals(lpMint.toBase58());
    const lpDecimal = lpMint ? await getTokenDecimals(lpMint.toBase58()) : null;

    try {
      showNotification('processing', 'Sending transaction...');
      const res = await withdraw(
        wallet,
        new PublicKey(address1),
        new PublicKey(address2),
        amount1 * Math.pow(10, quoteDecimal),
        amount2 * Math.pow(10, baseDecimal),
        lpAmount * Math.pow(10, lpDecimal)
      );
      console.log("🚀 ~ handleWithdraw ~ res:", res);
      setIsLoading(false);
      if (res && typeof res === 'string') {
        // successAlert("Withdraw success.");
        showNotification('success', 'Transaction confirmed!', res);
      } else {
        // errorAlert("Withdraw failed.");
        showNotification('error','""','Transaction failed');
      }
    } catch (error) {
      setIsLoading(false);
      console.log("Withdraw failed");
      // errorAlert("Withdraw failed");
      showNotification('error','""','Transaction failed');
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
              {quoteTokenData?.id && (
                <span className="text-gray-500 dark:text-gray-400">
                  Balance: {quoteBalance}
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
                  {!(quoteTokenData?.id && baseTokenData?.id) && (
                    <button className="w-full p-4 rounded-xl border-2 border-purple-500 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="text-center text-purple-600 dark:text-purple-400 font-medium">
                        Select a position
                      </div>
                    </button>
                  )}

                  {quoteTokenData?.id && baseTokenData?.id && (
                    <button className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex -space-x-2">
                            <img
                              src={quoteTokenData.img}
                              alt={quoteTokenData.symbol}
                              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                            />
                            <img
                              src={baseTokenData.img}
                              alt={baseTokenData.symbol}
                              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                            />
                          </div>
                          <div className="ml-3 text-left">
                            <div className="font-medium">
                              {quoteTokenData.id}/{baseTokenData.id}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {/* {quoteTokenData.quoteAmount}  */}
                              1.5 {quoteTokenData.id} +
                              {/* {baseTokenData.baseAmount}  */}
                              187.50 {baseTokenData.id}
                            </div>
                          </div>
                        </div>
                        <ChevronDown size={20} className="text-gray-500" />
                      </div>
                    </button>
                  )}
                </div>
              </div>
              {quoteTokenData?.id && baseTokenData?.id && (
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
                            {quoteTokenData ? (
                              <>
                                <img
                                  src={quoteTokenData.img}
                                  alt={quoteTokenData.text}
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                                <span>{quoteTokenData.id}</span>
                              </>
                            ) : (
                              <span></span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{quoteAmount}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ≈ $125.75
                              {/* ${quoteTokenDataUsdValue.toFixed(2)} */}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {baseTokenData ? (
                              <>
                                <img
                                  src={baseTokenData.img}
                                  alt={baseTokenData.text}
                                  className="w-6 h-6 rounded-full mr-2"
                                />
                                <span>{baseTokenData.id}</span>
                              </>
                            ) : (
                              <span></span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{baseAmount}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ≈ $125.00
                              {/* ${baseTokenDataUsdValue.toFixed(2)} */}
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between font-medium">
                          <span>Total:</span>
                          <span>
                            ≈ $250.75
                            {/* ${totalUsdValue.toFixed(2)} */}
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
                      {quoteTokenData && baseTokenData ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {quoteTokenData.id} price:
                            </span>
                            <span>
                              1 {quoteTokenData.id} ={" "}
                              {(
                                baseTokenData.price! / quoteTokenData.price!
                              ).toFixed(6)}{" "}
                              {baseTokenData.id}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">
                              {baseTokenData.id} price:
                            </span>
                            <span>
                              1 {baseTokenData.id} ={" "}
                              {(
                                quoteTokenData.price! / baseTokenData.price!
                              ).toFixed(6)}{" "}
                              {quoteTokenData.id}
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
                          {/* {withdrawAmount && balance
                            ? `${((parseFloat(withdrawAmount) / parseFloat(balance)) * 100).toFixed(4)}%`
                            : '0%'
                          } */}
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
            {!quoteTokenData?.id || !baseTokenData?.id ? (
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
                    quoteTokenData?.address &&
                    baseTokenData?.address &&
                    quoteAmount &&
                    baseAmount &&
                    lpTokenAmount
                  ) {
                    handleWithdraw(
                      quoteTokenData.address,
                      baseTokenData.address,
                      quoteAmount,
                      baseAmount,
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
