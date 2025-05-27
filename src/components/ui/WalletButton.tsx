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
    const fetchData = async () => {
      if (publicKey && !login) {
        const updatedUser = {
          wallet: publicKey.toBase58(),
          isLedger: wallet?.adapter?.name?.toLowerCase().includes('ledger') ? 1 : 0,
        };
        await sign(updatedUser);
      }
    };
    fetchData();
  }, [publicKey, wallet]);

  const sign = async (updatedUser: userInfo) => {
    try {
      setIsLoading(true);
  
      // 1. Attempt to log in
      try {
        const loginRes = await axios.post(`${BACKEND_URL}/user/login`, { 
          wallet: updatedUser.wallet 
        });
  
        if (loginRes?.status === 200 && loginRes?.data?.token) {
          setUser(loginRes.data);
          setLogin(true);
          successAlert("Login successful.");
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        // Only proceed to registration if user not found
        if (err?.response?.status !== 404) {
          console.error("Login error:", err);
          errorAlert(err?.response?.data?.message || "Login failed.");
          setIsLoading(false);
          return;
        }
      }
  
      // 2. Register user (wallet connect) and get nonce
      const connection = await walletConnect({ data: updatedUser });
  
      if (!connection || !connection.nonce) {
        errorAlert("Failed to get nonce from server.");
        setIsLoading(false);
        return;
      }
  
      // 3. Sign the nonce message
      try {
        const msg = new TextEncoder().encode(`Nonce to confirm: ${connection.nonce}`);
        const sig = await signMessage?.(msg);
        
        if (!sig) {
          throw new Error("Failed to sign message");
        }

        const res = base58.encode(sig);
        const signedWallet = { 
          ...connection, 
          signature: res,
          isLedger: updatedUser.isLedger 
        };
  
        // 4. Confirm wallet
        const confirm = await confirmWallet({ data: signedWallet });
  
        if (confirm) {
          setUser(confirm);
          setLogin(true);
          successAlert("Wallet connected successfully.");
        } else {
          errorAlert("Wallet confirmation failed.");
        }
      } catch (error) {
        console.error("Signing error:", error);
        errorAlert("Failed to sign message. Please try again.");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      errorAlert("Failed to connect wallet. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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