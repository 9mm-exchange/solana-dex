import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { u16ToBytes } from "@raydium-io/raydium-sdk";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AMM_CONFIG_SEED } from "../program/constant";
import { RaydiumCpSwap } from "../program/raydium_cp_swap";
import raydiumCpSwapIdl from "../program/raydium_cp_swap.json";
import { commitmentLevel, connection } from "../program/web3";

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
  token0Amount: BN,
  token1Amount: BN,
  poolAddress: PublicKey,
): Promise<BN> {
  console.log("🚀 ~ calculateLpAmountForDeposit ~ token0Amount:", token0Amount.toNumber())
  console.log("🚀 ~ calculateLpAmountForDeposit ~ token1Amount:", token1Amount.toNumber())
  console.log("🚀 ~ calculateLpAmountForDeposit ~ poolAddress:", poolAddress.toBase58())
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  // const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);
  const program = new Program<RaydiumCpSwap>(
    raydiumCpSwapIdl as RaydiumCpSwap,
    provider
  );

  // Get pool state
  const poolState = await program.account["poolState"].fetch(poolAddress);
  
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
    program.programId
  );
  const configData = await program.account["ammConfig"].fetch(configAddr);
  const token0Decimals = poolState.mint0Decimals;
  const token1Decimals = poolState.mint1Decimals;
  const token0Info = await connection.getTokenAccountBalance(poolState.token0Vault);
  const token1Info = await connection.getTokenAccountBalance(poolState.token1Vault);
  const token0TotalAmount = token0Info.value.amount;
  const token1TotalAmount = token1Info.value.amount;
  // Calculate the ratio of your token0 contribution
  const token0Ratio = token0Amount.mul(new BN(1000000000)).div(new BN(token0TotalAmount));
  
  // Calculate the ratio of your token1 contribution
  const token1Ratio = token1Amount.mul(new BN(1000000000)).div(new BN(token1TotalAmount));
  // Take the minimum ratio to ensure proper proportion
  const minRatio = BN.min(token0Ratio, token1Ratio);
  
  // Calculate LP tokens based on the ratio
  const lpAmount = poolState.lpSupply.mul(minRatio).div(new BN(1000000000));
  
  return lpAmount;
}