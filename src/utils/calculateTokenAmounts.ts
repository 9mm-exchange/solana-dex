import { PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { RaydiumCpSwap } from "../program/raydium_cp_swap";
import { connection } from "../program/web3";
import { AMM_CONFIG_SEED, POOL_SEED } from "../program/constant";
import { u16ToBytes } from "@raydium-io/raydium-sdk";

export interface TokenAmounts {
  token0Amount: number;
  token1Amount: number;
}

export async function calculateTokenAmounts(
  program: Program<RaydiumCpSwap>,
  token0Address: string,
  token1Address: string,
  lpAmount: number
): Promise<TokenAmounts> {
  try {
    const [configAddr] = await PublicKey.findProgramAddress(
      [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
      program.programId
    );

    const [poolAddress] = await PublicKey.findProgramAddress(
      [
        Buffer.from(POOL_SEED),
        configAddr.toBuffer(),
        new PublicKey(token0Address).toBuffer(),
        new PublicKey(token1Address).toBuffer(),
      ],
      program.programId
    );

    const poolState = await program.account.poolState.fetch(poolAddress);
    const token0Info = await connection.getTokenAccountBalance(poolState.token0Vault);
    const token1Info = await connection.getTokenAccountBalance(poolState.token1Vault);
    
    const token0TotalAmount = Number(token0Info.value.amount);
    const token1TotalAmount = Number(token1Info.value.amount);
    const totalLpSupply = Number(poolState.lpSupply);

    // Calculate proportional amounts
    const ratio = lpAmount / totalLpSupply;
    const token0Amount = (token0TotalAmount * ratio) / Math.pow(10, poolState.mint0Decimals);
    const token1Amount = (token1TotalAmount * ratio) / Math.pow(10, poolState.mint1Decimals);

    return {
      token0Amount,
      token1Amount
    };
  } catch (error) {
    console.error("Error calculating token amounts:", error);
    return {
      token0Amount: 0,
      token1Amount: 0
    };
  }
} 