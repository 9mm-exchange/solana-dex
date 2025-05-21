"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import base58 from "bs58";
import { Wallet } from 'lucide-react';
import { FC, useContext, useEffect } from "react";
import UserContext from "../../context/UserContext";
import { userInfo } from "../../types";
import { confirmWallet, walletConnect } from "../../utils/util";
import { errorAlert, successAlert } from "./ToastGroup";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const WalletButton: FC = () => {
  const { user, setUser, login, setLogin, isLoading, setIsLoading } = useContext(UserContext);
  const { connected, publicKey, disconnect, signMessage, wallet } = useWallet();
  
  useEffect(() => {
  /**
   * Checks if the user has a public key and is not logged in. If so, attempts to log in the user.
   * If the user doesn't exist, it will attempt to register the user and sign a nonce message.
   * Also sets the user's isLedger flag to 0.
   */
    const fetchData = async () => {
      if (publicKey && !login) {
        const updatedUser = {
          wallet: publicKey.toBase58(),
          // isLedger: false,
          isLedger: 0,
        };
        await sign(updatedUser);
      }
    };
    fetchData();
  }, [publicKey]);

  /**
   * Attempts to log in to the app and connect a wallet.
   * If the user doesn't exist, it will attempt to register the user and sign a nonce message.
   * @param updatedUser - The user object with the wallet address
   */
  const sign = async (updatedUser: userInfo) => {
    try {
      setIsLoading(true);
  
      // 1. Attempt to log in
      const loginRes = await axios.post(`${BACKEND_URL}/user/login`, { wallet: updatedUser.wallet });
  
      if (loginRes?.status === 200 && loginRes?.data?.token) {
        setUser(loginRes.data);
        setLogin(true);
        successAlert("Login successful.");
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
  
      if (status !== 404 && message !== "user not found") {
        console.error("Login error:", err.message);
        errorAlert("Login failed.");
        setIsLoading(false);
        return;
      }
    }
  
    try {
      // 2. Register user (wallet connect) and get nonce
      const connection = await walletConnect({ data: updatedUser });
  
      if (!connection || connection.nonce === undefined) {
        errorAlert("Wallet connect failed.");
        setIsLoading(false);
        return;
      }
  
      // 3. Sign the nonce message
      const msg = new TextEncoder().encode(`Nonce to confirm: ${connection.nonce}`);
      const sig = await signMessage?.(msg);
      const res = base58.encode(sig as Uint8Array);
  
      const signedWallet = { ...connection, signature: res };
  
      // 4. Confirm wallet
      const confirm = await confirmWallet({ data: signedWallet });
  
      if (confirm) {
        setUser(confirm);
        setLogin(true);
        successAlert("Wallet connected.");
      } else {
        errorAlert("Wallet confirmation failed.");
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      errorAlert("Sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };


  // const { adapter: { icon = "", name = "" } = {} } = wallet || {};

  return (
    <WalletMultiButton
      className="!bg-purple-600 hover:!bg-purple-700 !rounded-xl !h-9 flex items-center"
      startIcon={<Wallet size={16} className="mr-2" />}
    >
      {connected
        ? `${publicKey?.toBase58().slice(0, 4)}...${publicKey?.toBase58().slice(-4)}`
        : 'Connect Wallet'}
    </WalletMultiButton>
  );
};

export default WalletButton;