import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { u16ToBytes } from "@raydium-io/raydium-sdk";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AMM_CONFIG_SEED } from "../program/constant";
import { RaydiumCpSwap } from "../program/raydium_cp_swap";
import raydiumCpSwapIdl from "../program/raydium_cp_swap.json";
import { commitmentLevel, connection } from "../program/web3";
import { getTokenDecimals } from "../program/utils";

// type WalletCompatible = anchor.Wallet;

type WalletCompatible = {
  publicKey: anchor.web3.PublicKey;
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>;
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>;
};

// Convert the wallet to be compatible with Anchor
function convertWallet(wallet: WalletContextState): WalletCompatible {
  if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
    throw new Error("Wallet is not fully connected");
  }

  return {
    publicKey: wallet.publicKey,
    signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) =>
      wallet.signTransaction!(tx) as Promise<T>,
    signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]) =>
      wallet.signAllTransactions!(txs) as Promise<T[]>
  };
}

export async function calculateLpAmountForDeposit(
  wallet: WalletContextState,
  token0Amount: number,
  token1Amount: number,
  poolAddress: PublicKey,
): Promise<{lpAmount: number, token0Amount: number, token1Amount: number}> {
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  const program = new Program<RaydiumCpSwap>(
    raydiumCpSwapIdl as RaydiumCpSwap,
    provider
  );

  // Get pool state
  const poolState = await program.account.poolState.fetch(poolAddress);
  
  const token0Info = await connection.getTokenAccountBalance(poolState.token0Vault);
  const token1Info = await connection.getTokenAccountBalance(poolState.token1Vault);
  const token0TotalAmount = Number(token0Info.value.amount);
  const token1TotalAmount = Number(token1Info.value.amount);
  const totalLpSupply = Number(poolState.lpSupply);

  // Handle initial deposit case (when pool is empty)
  if (token0TotalAmount === 0 && token1TotalAmount === 0) {
    // For initial deposit, use the geometric mean of the two token amounts
    // This ensures a fair initial LP token distribution
    const geometricMean = Math.sqrt(token0Amount * token1Amount);
    return {lpAmount: Math.floor(geometricMean), token0Amount: token0TotalAmount, token1Amount: token1TotalAmount};
  }

  // For subsequent deposits, calculate based on the ratio of contributions
  const ratio = token0Amount / (token0TotalAmount / Math.pow(10, poolState.mint0Decimals));
  
  // Calculate LP tokens based on the ratio and current LP supply
  const lpAmount = Math.floor(ratio * totalLpSupply);

  const lpDecimal = await getTokenDecimals(poolState.lpMint.toBase58());
  
  return {lpAmount: lpAmount / Math.pow(10, lpDecimal), token0Amount: token0TotalAmount, token1Amount: token1TotalAmount};
}