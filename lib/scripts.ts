import { BN, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
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
  AMM_CONFIG_SEED,
  AUTH_SEED,
  OBSERVATION_SEED,
  POOL_LP_MINT_SEED,
  POOL_SEED,
  POOL_VAULT_SEED
} from "./constant";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createTokenMintAndAssociatedTokenAccount, u16ToBytes } from "./util";
import { mintAuthority } from '../../BOT/Pumpfun-bundler/config';

export const createConfigTx = async (
  admin: PublicKey,

  index: number,
  tradeFee: number,
  protocolFee: number,
  fundFee: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(index)],
    program.programId
  );
  console.log("🚀 ~ configAddr:", configAddr)

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

export const updateAmmConfigTx = async (
  admin: PublicKey,

  param: number,
  value: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const tx = await program.methods
    .updateAmmConfig(param, new BN(value))
    .accounts({
    })
    .transaction();

  tx.feePayer = admin;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export const updatePoolStatusTx = async (
  admin: PublicKey,

  status: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const tx = await program.methods
    .updatePoolStatus(status)
    .accounts({
    })
    .transaction();

  tx.feePayer = admin;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export const collectProtocolFeeTx = async (
  admin: PublicKey,

  amount0Requested: number,
  amount1Requested: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const tx = await program.methods
    .collectProtocolFee(new BN(amount0Requested), new BN(amount1Requested))
    .accounts({
    })
    .transaction();

  tx.feePayer = admin;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export const collectFundFeeTx = async (
  admin: PublicKey,

  amount0Requested: number,
  amount1Requested: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const tx = await program.methods
    .collectFundFee(new BN(amount0Requested), new BN(amount1Requested))
    .accounts({
    })
    .transaction();

  tx.feePayer = admin;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export const initializeTx = async (
  admin: NodeWallet,
  creator: PublicKey,
  
  index: number,

  initAmount0: number,
  initAmount1: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(index)],
    program.programId
  );
  console.log("configAddr:", configAddr.toBase58())
  
  const transferFeeConfig = { transferFeeBasisPoints: 0, MaxFee: 0 };
  const mintAuthorityKeypair = Keypair.generate();
  console.log("🚀 ~ mintAuthorityKeypair:", mintAuthorityKeypair.publicKey.toBase58())
  const mintAuthority = new NodeWallet(mintAuthorityKeypair);
  
  const [{ token0, token0Program}, { token1, token1Program }] = await createTokenMintAndAssociatedTokenAccount(
    connection,
    admin,
    mintAuthority,
    transferFeeConfig
  );
  console.log("token0: ", token0.toBase58());
  console.log("token1: ", token1.toBase58());

  const [auth] = await PublicKey.findProgramAddress(
    [Buffer.from(AUTH_SEED)],
    program.programId
  );
  console.log("auth", auth.toBase58());
  
  const [poolAddress, _] = await PublicKey.findProgramAddress(
    [
      Buffer.from(POOL_SEED),
      configAddr.toBuffer(),
      token0.toBuffer(),
      token1.toBuffer(),
    ],
    program.programId
  )
  console.log("poolAddress: ", poolAddress.toBase58());
  
  const [lpMint] = await PublicKey.findProgramAddress(
    [Buffer.from(POOL_LP_MINT_SEED), poolAddress.toBuffer()],
    program.programId
  )
  console.log("lpMint: ", lpMint.toBase58());

  const [vault0] = await PublicKey.findProgramAddress(
    [
      Buffer.from(POOL_VAULT_SEED),
      token0.toBuffer(),
      poolAddress.toBuffer()
    ],
    program.programId
  )
  console.log("vault0: ", vault0.toBase58());

  const [vault1] = await PublicKey.findProgramAddress(
    [
      Buffer.from(POOL_VAULT_SEED),
      token1.toBuffer(),
      poolAddress.toBuffer()
    ],
    program.programId
  )
  console.log("vault1: ", vault1.toBase58());
  
  const [creatorLpTokenAddr] = await PublicKey.findProgramAddress(
    [creator.toBuffer(), lpMint.toBuffer()],
    program.programId
  );
  console.log("creatorLpTokenAddr: ", creatorLpTokenAddr.toBase58());

  const [observationAddr] = await PublicKey.findProgramAddress(
    [
      Buffer.from(OBSERVATION_SEED),
      poolAddress.toBuffer()
    ],
    program.programId
  )
  console.log("observationAddr: ", observationAddr.toBase58());

  const creatorToken0 = getAssociatedTokenAddressSync(
    token0,
    creator,
    false,
    token0Program
  )
  console.log("creatorToken0: ", creatorToken0.toBase58());

  const creatorToken1 = getAssociatedTokenAddressSync(
    token1,
    creator,
    false,
    token1Program
  )
  console.log("creatorToken1: ", creatorToken1.toBase58());

  const tx = await program.methods
    .initialize(new BN(initAmount0), new BN(initAmount1), new BN(0))
    .accounts({
      creatorLpToken: creatorLpTokenAddr,
      creator: creator,
      ammConfig: configAddr,
      creatorToken0: creatorToken0,
      creatorToken1: creatorToken1,
      token0Mint: token0,
      token1Mint: token1,
      token0Program: token0Program,
      token1Program: token1Program,
    })
    .transaction();

  tx.feePayer = creator;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}
