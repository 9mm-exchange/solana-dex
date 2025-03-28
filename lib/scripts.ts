import { BN, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
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
  createInitializeMintInstruction,
  createMint,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { createTokenMintAndAssociatedTokenAccount, execTx, getAssociatedTokenAccount, u16ToBytes } from "./util";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

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
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
    program.programId
  );
  console.log("🚀 ~ configAddr:", configAddr)
  const tx = await program.methods
    .updateAmmConfig(param, new BN(value))
    .accounts({
      ammConfig: configAddr
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

  token0: PublicKey,
  token1: PublicKey,
  index: number,

  amount0Requested: number,
  amount1Requested: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(index)],
    program.programId
  );
  console.log("configAddr:", configAddr.toBase58())

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

  const creatorLpTokenAddr = getAssociatedTokenAccount(admin, lpMint);
  console.log("creatorLpTokenAddr: ", creatorLpTokenAddr.toBase58());

  const [observationAddr] = await PublicKey.findProgramAddress(
    [
      Buffer.from(OBSERVATION_SEED),
      poolAddress.toBuffer()
    ],
    program.programId
  )
  console.log("observationAddr: ", observationAddr.toBase58());

  const poolState = await program.account.poolState.fetch(poolAddress)
  console.log("poolState: ", poolState);

  const creatorToken0 = getAssociatedTokenAddressSync(
    token0,
    admin,
    false,
    poolState.token0Program
  )
  console.log("creatorToken0: ", creatorToken0.toBase58());

  const creatorToken1 = getAssociatedTokenAddressSync(
    token1,
    admin,
    false,
    poolState.token1Program
  )
  console.log("creatorToken1: ", creatorToken1.toBase58());

  const vault0 = poolState.token0Vault;
  console.log("vault0: ", vault0.toBase58());

  const vault1 = poolState.token1Vault;
  console.log("vault1: ", vault1);
  const tx = await program.methods
    .collectProtocolFee(new BN(amount0Requested), new BN(amount1Requested))
    .accounts({
      ammConfig: configAddr,
      owner: admin,
      poolState: poolAddress,
      recipientToken0Account: creatorToken0,
      recipientToken1Account: creatorToken1,
      token0Vault: vault0,
      token1Vault: vault1,
      vault0Mint: token0,
      vault1Mint: token1,
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
  creator: NodeWallet,

  index: number,

  initAmount0: number,
  initAmount1: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const transferFeeConfig = { transferFeeBasisPoints: 100, MaxFee: 50000000 };  //1%
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(index)],
    program.programId
  );
  console.log("configAddr:", configAddr.toBase58())

  // const [{ token0, token0Program }, { token1, token1Program }] = await createTokenMintAndAssociatedTokenAccount(
  //   connection,
  //   creator,
  //   creator,
  //   transferFeeConfig
  // );
  const token0 = new PublicKey("2xWJ41u15QsGHHwcdj1yvgNahyd3wrW4RqHZz7fPqw5n");
  const token1 = new PublicKey("7yxzbjLZpsJoqe9VBtkNLrx7r4dbkVdD9XJm2i2QXRcU");
  const token0Program = TOKEN_2022_PROGRAM_ID;
  const token1Program = TOKEN_PROGRAM_ID;
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

  const creatorLpTokenAddr = getAssociatedTokenAccount(creator.publicKey, lpMint);
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
    creator.publicKey,
    undefined,
    token0Program
  )
  console.log("creatorToken0: ", creatorToken0.toBase58());

  const creatorToken1 = getAssociatedTokenAddressSync(
    token1,
    creator.publicKey,
    undefined,
    token1Program
  )
  console.log("creatorToken1: ", creatorToken1.toBase58());

  const tx = await program.methods
    .initialize(new BN(initAmount0), new BN(initAmount1), new BN(0))
    .accounts({
      creatorLpToken: creatorLpTokenAddr,
      creator: creator.publicKey,
      ammConfig: configAddr,
      creatorToken0: creatorToken0,
      creatorToken1: creatorToken1,
      token0Mint: token0,
      token1Mint: token1,
      token0Program: token0Program,
      token1Program: token1Program,
    })
    .signers([creator.payer, admin.payer])
    .transaction();

  tx.feePayer = creator.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export const depositTx = async (
  creator: NodeWallet,

  token0: PublicKey,
  token1: PublicKey,
  index: number,
  lpAmount: number,
  token0Amount: number,
  token1Amount: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(index)],
    program.programId
  );
  console.log("configAddr:", configAddr.toBase58())

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

  const creatorLpTokenAddr = getAssociatedTokenAccount(creator.publicKey, lpMint);
  console.log("creatorLpTokenAddr: ", creatorLpTokenAddr.toBase58());

  const [observationAddr] = await PublicKey.findProgramAddress(
    [
      Buffer.from(OBSERVATION_SEED),
      poolAddress.toBuffer()
    ],
    program.programId
  )
  console.log("observationAddr: ", observationAddr.toBase58());

  const poolState = await program.account.poolState.fetch(poolAddress)
  console.log("poolState: ", poolState);

  const creatorToken0 = getAssociatedTokenAddressSync(
    token0,
    creator.publicKey,
    false,
    poolState.token0Program
  )
  console.log("creatorToken0: ", creatorToken0.toBase58());

  const creatorToken1 = getAssociatedTokenAddressSync(
    token1,
    creator.publicKey,
    false,
    poolState.token1Program
  )
  console.log("creatorToken1: ", creatorToken1.toBase58());

  const vault0 = poolState.token0Vault;
  console.log("vault0: ", vault0.toBase58());

  const vault1 = poolState.token1Vault;
  console.log("vault1: ", vault1);

  const tx = await program.methods
    .deposit(new BN(lpAmount), new BN(token0Amount), new BN(token1Amount))
    .accounts({
      lpMint: lpMint,
      owner: creator.publicKey,
      ownerLpToken: creatorLpTokenAddr,
      poolState: poolAddress,
      token0Account: creatorToken0,
      token0Vault: vault0,
      token1Account: creatorToken1,
      token1Vault: vault1,
      vault0Mint: token0,
      vault1Mint: token1
    })
    .transaction();

  tx.feePayer = creator.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export const swapTx = async (
  creator: NodeWallet,

  inputToken: PublicKey,
  outputToken: PublicKey,
  index: number,
  amount: number,
  direction: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(index)],
    program.programId
  );
  console.log("configAddr:", configAddr.toBase58())

  const [auth] = await PublicKey.findProgramAddress(
    [Buffer.from(AUTH_SEED)],
    program.programId
  );
  console.log("auth", auth.toBase58());

  const [poolAddress, _] = await PublicKey.findProgramAddress(
    [
      Buffer.from(POOL_SEED),
      configAddr.toBuffer(),
      inputToken.toBuffer(),
      outputToken.toBuffer(),
    ],
    program.programId
  )
  console.log("poolAddress: ", poolAddress.toBase58());

  const poolState = await program.account.poolState.fetch(poolAddress)
  console.log("poolState: ", poolState);

  const inputVault = poolState.token0Vault;
  console.log("inputVault: ", inputVault.toBase58());

  const outputVault = poolState.token1Vault;
  console.log("outputVault: ", outputVault);

  const inputTokenAcc = getAssociatedTokenAddressSync(
    inputToken,
    creator.publicKey,
    false,
    poolState.token0Program
  )
  console.log("inputTokenAcc: ", inputTokenAcc.toBase58());

  const [observationAddr] = await PublicKey.findProgramAddress(
    [
      Buffer.from(OBSERVATION_SEED),
      poolAddress.toBuffer()
    ],
    program.programId
  )
  console.log("observationAddr: ", observationAddr.toBase58());

  const outputTokenAcc = getAssociatedTokenAddressSync(
    outputToken,
    creator.publicKey,
    false,
    poolState.token1Program
  )
  console.log("outputTokenAcc: ", outputTokenAcc.toBase58());

  let tx = new Transaction();

  if (direction == 0) {
    tx = await program.methods
      .swapBaseInput(new BN(amount), new BN(0))
      .accounts({
        ammConfig: configAddr,
        inputTokenAccount: inputTokenAcc,
        inputTokenMint: inputToken,
        inputTokenProgram: poolState.token0Program,
        outputTokenAccount: outputTokenAcc,
        outputTokenMint: outputToken,
        inputVault: inputVault,
        outputVault: outputVault,
        observationState: observationAddr,
        outputTokenProgram: poolState.token1Program,
        poolState: poolAddress,
        payer: creator.publicKey
      })
      .transaction();
  } else {
    tx = await program.methods
      .swapBaseOutput(new BN(amount), new BN(1000000000000))
      .accounts({
        ammConfig: configAddr,
        inputTokenAccount: inputTokenAcc,
        inputTokenMint: inputToken,
        inputTokenProgram: poolState.token0Program,
        outputTokenAccount: outputTokenAcc,
        outputTokenMint: outputToken,
        inputVault: inputVault,
        outputVault: outputVault,
        observationState: observationAddr,
        outputTokenProgram: poolState.token1Program,
        poolState: poolAddress,
        payer: creator.publicKey
      })
      .transaction();
  }

  tx.feePayer = creator.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}

export const withdrawTx = async (
  creator: NodeWallet,

  index: number,
  token0: PublicKey,
  token1: PublicKey,
  token0Amount: number,
  token1Amount: number,
  lpAmount: number,

  connection: Connection,
  program: Program<RaydiumCpSwap>
) => {
  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(index)],
    program.programId
  );
  console.log("configAddr:", configAddr.toBase58())

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

  const poolState = await program.account.poolState.fetch(poolAddress)
  console.log("poolState: ", poolState);

  const inputVault = poolState.token0Vault;
  console.log("inputVault: ", inputVault.toBase58());

  const outputVault = poolState.token1Vault;
  console.log("outputVault: ", outputVault);

  const token0Acc = getAssociatedTokenAddressSync(
    token0,
    creator.publicKey,
    false,
    poolState.token0Program
  )
  console.log("token0Acc: ", token0Acc.toBase58());

  const [observationAddr] = await PublicKey.findProgramAddress(
    [
      Buffer.from(OBSERVATION_SEED),
      poolAddress.toBuffer()
    ],
    program.programId
  )
  console.log("observationAddr: ", observationAddr.toBase58());

  const token1Acc = getAssociatedTokenAddressSync(
    token1,
    creator.publicKey,
    false,
    poolState.token1Program
  )
  console.log("token1Acc: ", token1Acc.toBase58());

  const [lpMint] = await PublicKey.findProgramAddress(
    [Buffer.from(POOL_LP_MINT_SEED), poolAddress.toBuffer()],
    program.programId
  )
  console.log("lpMint: ", lpMint.toBase58());

  const [ownerLpToken] = await PublicKey.findProgramAddress(
    [
      creator.publicKey.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      lpMint.toBuffer(),
    ],
    ASSOCIATED_PROGRAM_ID
  );
  console.log("owner lp token: ", ownerLpToken.toBase58());

  const vault0 = poolState.token0Vault;
  console.log("vault0: ", vault0.toBase58());

  const vault1 = poolState.token1Vault;
  console.log("vault1: ", vault1.toBase58());

  const tx = await program.methods
    .withdraw(new BN(lpAmount), new BN(token0Amount), new BN(token1Amount))
    .accounts({
      lpMint: lpMint,
      owner: creator.publicKey,
      ownerLpToken: ownerLpToken,
      poolState: poolAddress,
      token0Account: token0Acc,
      token1Account: token1Acc,
      token0Vault: vault0,
      token1Vault: vault1,
      vault0Mint: token0,
      vault1Mint: token1
    })
    .transaction();

  tx.feePayer = creator.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  return tx;
}