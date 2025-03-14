import { BN, Program } from "@coral-xyz/anchor";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from "@solana/web3.js";

import { RaydiumCpSwap } from "../target/types/raydium_cp_swap";
import {
  AMM_CONFIG_SEED
} from "./constant";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

export const createConfigTx = async (
  admin: PublicKey,

  index: number,
  tradeFee: number,
  protocolFee: number,
  fundFee: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const [configPda, _] = PublicKey.findProgramAddressSync(
    [Buffer.from(AMM_CONFIG_SEED)],
    program.programId
  );

  console.log("configPda: ", configPda.toBase58());

  const tx = await program.methods
    .createAmmConfig(
      index,
      new BN(tradeFee),
      new BN(protocolFee),
      new BN(fundFee)
    )
    .accounts({
      payer: admin,
    })
    .transaction();

  tx.feePayer = admin;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
};

