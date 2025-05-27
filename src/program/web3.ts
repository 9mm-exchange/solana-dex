import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { AMM_CONFIG_SEED, POOL_SEED, u16ToBytes } from "@raydium-io/raydium-sdk";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync, getMint, getTokenMetadata, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { ENV, TokenListProvider } from "@solana/spl-token-registry";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";
import { BN } from "bn.js";
import { errorAlert } from "../components/ui/ToastGroup";
import { RaydiumCpSwap } from "../program/raydium_cp_swap";
import raydiumCpSwapIdl from "../program/raydium_cp_swap.json";
import { calculateDepositAmounts, calculateSwapResult, fromBigInt, toBigInt } from "../utils/getOutAmount";
import { AUTH_SEED, OBSERVATION_SEED, POOL_LP_MINT_SEED } from "./constant";
import { execTx } from "./transaction";
import { checkTokenStandard, getTokenDecimals } from "./utils";


const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

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

export const getAssociatedTokenAccount = (
  ownerPubkey: PublicKey,
  mintPk: PublicKey
): PublicKey => {
  let associatedTokenAccountPubkey = (PublicKey.findProgramAddressSync(
    [
      ownerPubkey.toBytes(),
      TOKEN_PROGRAM_ID.toBytes(),
      mintPk.toBytes(), // mint address
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  ))[0];

  return associatedTokenAccountPubkey;
}

export const commitmentLevel = "processed";

export const endpoint =
  import.meta.env.VITE_SOLANA_RPC || clusterApiUrl("devnet");
export const connection = new Connection(endpoint, commitmentLevel);
export const raydiumCpSwapId = new PublicKey(raydiumCpSwapIdl.address);
export const raydiumCpSwapProgramInterface = JSON.parse(JSON.stringify(raydiumCpSwapIdl));

export const createPool = async (
  wallet: WalletContextState, 
  quoteToken: PublicKey, 
  baseToken: PublicKey, 
  quoteAmount: number, 
  baseAmount: number, 
  quoteProgram: PublicKey, 
  baseProgram: PublicKey
) => {
  console.log("quoteToken: ", quoteToken.toBase58());
  console.log("baseToken: ", baseToken.toBase58());
  console.log("createpool: ", quoteToken.toBase58() < baseToken.toBase58());

  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);

  // check the connection
  if (!wallet.publicKey || !connection) {
    errorAlert("Wallet Not Connected");
    return "WalletError";
  }

  try {

    const [configAddr] = await PublicKey.findProgramAddress(
      [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
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
        quoteToken.toBuffer(),
        baseToken.toBuffer(),
      ],
      program.programId
    )
    console.log("poolAddress: ", poolAddress.toBase58());

    const [lpMint] = await PublicKey.findProgramAddress(
      [Buffer.from(POOL_LP_MINT_SEED), poolAddress.toBuffer()],
      program.programId
    )
    console.log("lpMint: ", lpMint.toBase58());

    const creatorLpTokenAddr = getAssociatedTokenAccount(wallet.publicKey, lpMint);
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
      quoteToken,
      wallet.publicKey,
      false,
      quoteProgram
    )
    console.log("creatorToken0: ", creatorToken0.toBase58());

    const creatorToken1 = getAssociatedTokenAddressSync(
      baseToken,
      wallet.publicKey,
      false,
      baseProgram
    )
    console.log("creatorToken1: ", creatorToken1.toBase58());

    console.log('baseAmount:', baseAmount);
    console.log('quoteAmount:', quoteAmount);

    const tx = new Transaction();
    tx.add(await program.methods
      .initialize(new BN(quoteAmount), new BN(baseAmount), new BN(0))
      .accounts({
        creatorLpToken: creatorLpTokenAddr,
        creator: wallet.publicKey,
        ammConfig: configAddr,
        creatorToken0: creatorToken0,
        creatorToken1: creatorToken1,
        token0Mint: quoteToken,
        token1Mint: baseToken,
        token0Program: quoteProgram,
        token1Program: baseProgram,
      }).instruction());

    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    console.log("tx: ", tx);
    const res = await execTx(tx, connection, wallet);
    console.log("res: ", res);
    if (res === null) {
      return null
    }
    return { res, lpMint, poolAddress };
  } catch (error) {
    errorAlert("");
    console.log("creating pool error: ", error)
    return error;
  }
}

export const deposit = async (
  wallet: WalletContextState,
  quoteAmount: number,
  baseAmount: number,
  lpAmount: number,
  poolAddress: PublicKey
) => {
  console.log("🚀 ~ deposit ~ lpAmount:", lpAmount);
  console.log("🚀 ~ deposit ~ quoteAmount:", quoteAmount);
  console.log("🚀 ~ deposit ~ baseAmount:", baseAmount);

  if (!wallet.publicKey || !connection) {
    errorAlert("Wallet Not Connected");
    return "WalletError";
  }

  if (!poolAddress) {
    errorAlert("Invalid pool address");
    return "PoolError";
  }

  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, {
    preflightCommitment: commitmentLevel,
  });
  anchor.setProvider(provider);

  const program = new Program<RaydiumCpSwap>(
    raydiumCpSwapIdl as RaydiumCpSwap,
    provider
  );

  try {
    const [configAddr] = await PublicKey.findProgramAddress(
      [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
      program.programId
    );
    console.log("configAddr:", configAddr.toBase58());

    const [auth] = await PublicKey.findProgramAddress([Buffer.from(AUTH_SEED)], program.programId);
    console.log("auth", auth.toBase58());

    console.log("poolAddress: ", poolAddress.toBase58());

    const [lpMint] = await PublicKey.findProgramAddress(
      [Buffer.from(POOL_LP_MINT_SEED), poolAddress.toBuffer()],
      program.programId
    );
    console.log("lpMint: ", lpMint.toBase58());

    const poolState = await program.account.poolState.fetch(poolAddress);
    console.log("poolState: ", poolState);

    // Get vault accounts to check their mints
    const vault0Info = await connection.getAccountInfo(poolState.token0Vault);
    const vault1Info = await connection.getAccountInfo(poolState.token1Vault);
    
    if (!vault0Info || !vault1Info) {
      throw new Error("Failed to fetch vault account info");
    }
    
    // Get the mint addresses from the vault accounts
    const vault0Mint = new PublicKey(vault0Info.data.slice(0, 32));
    const vault1Mint = new PublicKey(vault1Info.data.slice(0, 32));

    // Create associated token accounts with the correct mints and programs
    const creatorLpTokenAddr = await getAssociatedTokenAddressSync(
      lpMint,
      wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    console.log("creatorLpTokenAddr: ", creatorLpTokenAddr.toBase58());

    const creatorToken0 = await getAssociatedTokenAddressSync(
      vault0Mint, // Use vault's mint
      wallet.publicKey,
      false,
      poolState.token0Program
    );
    console.log("creatorToken0: ", creatorToken0.toBase58());

    const creatorToken1 = await getAssociatedTokenAddressSync(
      vault1Mint, // Use vault's mint
      wallet.publicKey,
      false,
      poolState.token1Program
    );
    console.log("creatorToken1: ", creatorToken1.toBase58());

    // Create instructions to create all necessary associated token accounts
    const createLpAtaIx = createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey, // payer
      creatorLpTokenAddr, // ata
      wallet.publicKey, // owner
      lpMint, // mint
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const createToken0AtaIx = createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey, // payer
      creatorToken0, // ata
      wallet.publicKey, // owner
      vault0Mint, // mint from vault
      poolState.token0Program,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const createToken1AtaIx = createAssociatedTokenAccountIdempotentInstruction(
      wallet.publicKey, // payer
      creatorToken1, // ata
      wallet.publicKey, // owner
      vault1Mint, // mint from vault
      poolState.token1Program,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const vault0 = poolState.token0Vault;
    const vault1 = poolState.token1Vault;

    const depositIx = await program.methods
      .deposit(new BN(lpAmount), new BN(quoteAmount), new BN(baseAmount))
      .accounts({
        owner: wallet.publicKey,
        poolState: poolAddress,
        ownerLpToken: creatorLpTokenAddr,
        token0Account: creatorToken0,
        token1Account: creatorToken1,
        token0Vault: vault0,
        token1Vault: vault1,
        vault0Mint: vault0Mint,
        vault1Mint: vault1Mint,
        lpMint: lpMint
      })
      .instruction();

    const tx = new Transaction();
    // Add create ATA instructions
    tx.add(createLpAtaIx);
    tx.add(createToken0AtaIx);
    tx.add(createToken1AtaIx);
    tx.add(depositIx);

    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const res = await execTx(tx, connection, wallet);
    return res;
  } catch (error) {
    console.error("Transaction failed:", error);
    if (error instanceof Error) {
      errorAlert(error.message);
    }
    return "TransactionError";
  }
};

export const withdraw = async (wallet: WalletContextState, quoteToken: PublicKey, baseToken: PublicKey, quoteAmount: number, baseAmount: number, lpAmount: number) => {
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  // const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);
  const program = new Program<RaydiumCpSwap>(
    raydiumCpSwapIdl as RaydiumCpSwap,
    provider
  );

  // check the connection
  if (!wallet.publicKey || !connection) {
    errorAlert("Wallet Not Connected");
    return "WalletError";
  }

  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
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
      quoteToken.toBuffer(),
      baseToken.toBuffer(),
    ],
    program.programId
  )
  console.log("poolAddress: ", poolAddress.toBase58());

  const poolState = await program.account.poolState.fetch(poolAddress)
  console.log("poolState: ", poolState);

  const token0Acc = getAssociatedTokenAddressSync(
    quoteToken,
    wallet.publicKey,
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
    baseToken,
    wallet.publicKey,
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
      wallet.publicKey.toBuffer(),
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

  try {
    const tx = await program.methods
      .withdraw(new BN(lpAmount), new BN(quoteAmount), new BN(baseAmount))
      .accounts({
        owner: wallet.publicKey,
        token0Account: token0Acc,
        token1Account: token1Acc,
        lpMint: lpMint,
        ownerLpToken: ownerLpToken,
        poolState: poolAddress,
        token0Vault: vault0,
        token1Vault: vault1,
        vault0Mint: poolState.token0Mint,
        vault1Mint: poolState.token1Mint
      })
      .transaction();

    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const res = await execTx(tx, connection, wallet);
    console.log("res: ", res);
    return res;
  } catch (error) {
    errorAlert("");
  }
}

export const swap = async (wallet: WalletContextState, selltokenMint: string, poolAddress: PublicKey, amount: number, direction: number) => {
  console.log("sell token: ", selltokenMint);
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  // const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);
  const program = new Program<RaydiumCpSwap>(
    raydiumCpSwapIdl as RaydiumCpSwap,
    provider
  );

  // check the connection
  if (!wallet.publicKey || !connection) {
    errorAlert("Wallet Not Connected");
    return "WalletError";
  }

  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
    program.programId
  );
  console.log("configAddr:", configAddr.toBase58())

  const [auth] = await PublicKey.findProgramAddress(
    [Buffer.from(AUTH_SEED)],
    program.programId
  );
  console.log("auth", auth.toBase58());

  const poolState = await program.account.poolState.fetch(poolAddress)
  console.log("poolState: ", poolState);

  const token0Decimals = await getTokenDecimals(poolState.token0Mint.toBase58());
  const token1Decimals = await getTokenDecimals(poolState.token1Mint.toBase58());

  let decimals: number;
  if (direction == 1) {
    decimals = token0Decimals;
  } else {
    decimals = token1Decimals;
  }

  const inputVault = poolState.token0Vault;
  console.log("inputVault: ", inputVault.toBase58());

  const outputVault = poolState.token1Vault;
  console.log("outputVault: ", outputVault);

  const inputTokenAcc = getAssociatedTokenAddressSync(
    poolState.token0Mint,
    wallet.publicKey,
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
    poolState.token1Mint,
    wallet.publicKey,
    false,
    poolState.token1Program
  )
  console.log("outputTokenAcc: ", outputTokenAcc.toBase58());

  let tx = new Transaction();
  try {
    if (direction == 1) {
      tx = await program.methods
        .swapBaseInput(new BN(amount * Math.pow(10, decimals)), new BN(0))
        .accounts({
          ammConfig: configAddr,
          inputTokenAccount: inputTokenAcc,
          inputTokenMint: poolState.token0Mint,
          inputTokenProgram: poolState.token0Program,
          outputTokenAccount: outputTokenAcc,
          outputTokenMint: poolState.token1Mint,
          inputVault: inputVault,
          outputVault: outputVault,
          observationState: observationAddr,
          outputTokenProgram: poolState.token1Program,
          poolState: poolAddress,
          payer: wallet.publicKey
        })
        .transaction();
    } else {
      tx = await program.methods
        .swapBaseInput(new BN(amount * Math.pow(10, decimals)), new BN(0))
        .accounts({
          ammConfig: configAddr,
          inputTokenAccount: outputTokenAcc,
          inputTokenMint: poolState.token1Mint,
          inputTokenProgram: poolState.token1Program,
          outputTokenAccount: inputTokenAcc,
          outputTokenMint: poolState.token0Mint,
          inputVault: outputVault,
          outputVault: inputVault,
          observationState: observationAddr,
          outputTokenProgram: poolState.token0Program,
          poolState: poolAddress,
          payer: wallet.publicKey
        })
        .transaction();
    }

    tx.feePayer = wallet.publicKey;
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

    const res = await execTx(tx, connection, wallet);
    console.log("res: ", res);
    return res;
  } catch (error) {
    console.log("Swap error")
    errorAlert("");
  }
}

export const getTokenBalance = async (wallet: string, mint_token: string) => {
  const token_account = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(wallet),
    { programId: TOKEN_PROGRAM_ID },
    'confirmed',
  );
  const token_2022_accounts = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(wallet),
    { programId: TOKEN_2022_PROGRAM_ID },
    'confirmed',
  );
  let token_accounts = [...token_account.value, ...token_2022_accounts.value];

  for (const account of token_accounts) {
    const parsedAccountInfo: any = account.account.data;
    if (parsedAccountInfo.parsed.info.mint === mint_token) {
      // return {
      //   uiAmount: parsedAccountInfo.parsed.info.tokenAmount.uiAmount,
      //   amount: parsedAccountInfo.parsed.info.tokenAmount.amount,
      // };
      return parsedAccountInfo.parsed.info.tokenAmount.uiAmount;
    }
  }
  // return {
  //   uiAmount: 0,
  //   amount: 0,
  // };
  return 0;
}

export const getLpMint = async (wallet: WalletContextState, token0: string, token1: string) => {
  if (token0 === undefined || token1 === undefined) {
    return;
  }
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  // const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);
  const program = new Program<RaydiumCpSwap>(
    raydiumCpSwapIdl as RaydiumCpSwap,
    provider
  );

  let quoteToken: PublicKey;
  let baseToken: PublicKey;
  if (await checkTokenStandard(token0)) {
    quoteToken = new PublicKey(token0);
    baseToken = new PublicKey(token1);
  } else {
    quoteToken = new PublicKey(token1);
    baseToken = new PublicKey(token0);
  }


  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
    program.programId
  );
  const [poolAddress, _] = await PublicKey.findProgramAddress(
    [
      Buffer.from(POOL_SEED),
      configAddr.toBuffer(),
      quoteToken.toBuffer(),
      baseToken.toBuffer(),
    ],
    program.programId
  )
  const [lpMint] = await PublicKey.findProgramAddress(
    [Buffer.from(POOL_LP_MINT_SEED), poolAddress.toBuffer()],
    program.programId
  )
  console.log("lpMint: ", lpMint.toBase58());

  return lpMint;
}

export const amountOut = async (
  wallet: WalletContextState,
  token0: string,
  token1: string,
  amount: number
) => {
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  // const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);
  const program = new Program<RaydiumCpSwap>(
      raydiumCpSwapIdl as RaydiumCpSwap,
      provider
    );

  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
    program.programId
  );
  const token0Mint = new PublicKey(token0);
  const token1Mint = new PublicKey(token1);
  const poolAddress = await PublicKey.findProgramAddress(
    [Buffer.from(POOL_SEED), configAddr.toBuffer(), token0Mint.toBuffer(), token1Mint.toBuffer()],
    program.programId
  );
  const poolState = await program.account.poolState.fetch(poolAddress[0]);
  const configData = await program.account.ammConfig.fetch(configAddr);
  const token0Decimals = poolState.mint0Decimals;
  const token1Decimals = poolState.mint1Decimals;
  const token0Info = await connection.getTokenAccountBalance(poolState.token0Vault);
  const token1Info = await connection.getTokenAccountBalance(poolState.token1Vault);
  const token0Amount = token0Info.value.amount;
  const token1Amount = token1Info.value.amount;
  const poolStateData = {
    token0Vault: poolState.token0Vault.toBase58(),
    token1Vault: poolState.token1Vault.toBase58(),
    token0Amount: BigInt(token0Amount),
    token1Amount: BigInt(token1Amount),
    tradeFeeRate: configData.tradeFeeRate.toNumber(),
    protocolFeeRate: configData.protocolFeeRate.toNumber(),
    fundFeeRate: configData.fundFeeRate.toNumber()
  };
  const result = await calculateSwapResult(
    { address: token0, decimals: token0Decimals },
    { address: token1, decimals: token1Decimals },
    amount,
    poolStateData
  );
  console.log("🚀 ~ result:", result)
  return result;
};

export const getMetaData2022 = async (token: string) => {
  try {
    const mint = new PublicKey(token);
    const mintInfo = await getMint(
      connection,
      mint,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const metadata = await getTokenMetadata(
      connection,
      mint,
      "confirmed"
    );

    if (!metadata || !metadata.uri) {
      return {
        name: "",
        symbol: "",
        uri: ""
      };
    }

    // Fetch the JSON metadata from the URI
    const response = await fetch(metadata.uri);
    const jsonData = await response.json();

    return {
      name: jsonData.name || "",
      symbol: jsonData.symbol || "",
      img: jsonData.image || ""
    };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return {
      name: "",
      symbol: "",
      img: ""
    };
  }
}

interface MetadataJson {
  name?: string;
  symbol?: string;
  image?: string;
}

export async function getMetadata(mint: string) {
  try {
    // First try getAsset RPC method
    try {
      const RPC = process.env.VITE_SOLANA_RPC || "https://api.devnet.solana.com";
      const response = await fetch(RPC, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getAsset",
          params: [mint]
        })
      });
      
      const data = await response.json();
      
      if (data.result?.content?.json_uri) {
        const jsonData = await fetch(data.result.content.json_uri);
        const jsonData2 = await jsonData.json();
        return {
          name: jsonData2.name || "",
          symbol: jsonData2.symbol || "",
          img: jsonData2.image || ""
        };
      }
    } catch (error) {
      console.log("Error fetching from getAsset, trying token list:", error);
    }

    // Fallback to token list if getAsset fails
    const provider = await new TokenListProvider().resolve();
    const tokenList = provider.filterByChainId(ENV.MainnetBeta).getList();
    const tokenMap = tokenList.reduce((map, item) => {
      map.set(item.address, item);
      return map;
    }, new Map());

    const token = tokenMap.get(mint);
    if (token) {
      return {
        name: token.name || "",
        symbol: token.symbol || "",
        img: token.logoURI || ""
      };
    }

    // If both methods fail, return empty values
    return {
      name: "",
      symbol: "",
      img: ""
    };
  } catch (error) {
    console.error("Error in getMetadata:", error);
    return {
      name: "",
      symbol: "",
      img: ""
    };
  }
}

export const getPoolAddress = async (
  wallet: WalletContextState,
  token0: string,
  token1: string
) => {
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  // const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);
  const program = new Program<RaydiumCpSwap>(
      raydiumCpSwapIdl as RaydiumCpSwap,
      provider
    );

  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
    program.programId
  );
  const token0Mint = new PublicKey(token0);
  const token1Mint = new PublicKey(token1);
  const [poolAddress, _] = await PublicKey.findProgramAddress(
    [Buffer.from(POOL_SEED), configAddr.toBuffer(), token0Mint.toBuffer(), token1Mint.toBuffer()],
    program.programId
  );

  return poolAddress;
}

export const getOutAmount = async (
  wallet: WalletContextState,
  poolAddress: PublicKey,
  amount: number
) => {
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  // const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);
  const program = new Program<RaydiumCpSwap>(
      raydiumCpSwapIdl as RaydiumCpSwap,
      provider
    );

  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
    program.programId
  );
  const poolState = await program.account.poolState.fetch(poolAddress);
  const configData = await program.account.ammConfig.fetch(configAddr);
  const token0Decimals = poolState.mint0Decimals;
  const token1Decimals = poolState.mint1Decimals;
  const token0Info = await connection.getTokenAccountBalance(poolState.token0Vault);
  const token1Info = await connection.getTokenAccountBalance(poolState.token1Vault);
  const token0Amount = token0Info.value.amount;
  console.log("🚀 ~ token0Amount:", token0Amount)
  const token1Amount = token1Info.value.amount;
  console.log("🚀 ~ token1Amount:", token1Amount)
  const poolStateData = {
    token0Vault: poolState.token0Vault.toBase58(),
    token1Vault: poolState.token1Vault.toBase58(),
    token0Amount: BigInt(token0Amount),
    token1Amount: BigInt(token1Amount),
    tradeFeeRate: configData.tradeFeeRate.toNumber(),
    protocolFeeRate: configData.protocolFeeRate.toNumber(),
    fundFeeRate: configData.fundFeeRate.toNumber()
  };
  const result = await calculateDepositAmounts(
    { address: poolState.token0Mint.toBase58(), decimals: token0Decimals },
    { address: poolState.token1Mint.toBase58(), decimals: token1Decimals },
    amount,
    poolStateData
  );
  console.log("🚀 ~ result:", result)
  return result;
  
}

export const getSwapOut = async (
  wallet: WalletContextState,
  address0: string,
  address1: string,
  poolAddress: PublicKey,
  amount: number,
) => {
  console.log("🚀 ~ amount:", amount)
  const anchorWallet = convertWallet(wallet);
  const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
  anchor.setProvider(provider);
  // const program = new Program(raydiumCpSwapProgramInterface as RaydiumCpSwap, provider);
  const program = new Program<RaydiumCpSwap>(
      raydiumCpSwapIdl as RaydiumCpSwap,
      provider
    );

  const [configAddr, bump] = await PublicKey.findProgramAddress(
    [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
    program.programId
  );
  const poolState = await program.account.poolState.fetch(poolAddress);
  console.log("🚀 ~ poolState:", poolState)
  const configData = await program.account.ammConfig.fetch(configAddr);
  console.log("🚀 ~ configData:", configData)
  const token0Decimals = poolState.mint0Decimals;
  const token1Decimals = poolState.mint1Decimals;
  const token0Info = await connection.getTokenAccountBalance(poolState.token0Vault);
  const token1Info = await connection.getTokenAccountBalance(poolState.token1Vault);
  const token0Amount = token0Info.value.amount;
  const token1Amount = token1Info.value.amount;

  if (address0 === poolState.token0Mint.toBase58()) {
    const tokenAmount = toBigInt(amount, token0Decimals);
    const ratio = (tokenAmount * BigInt(1000000000)) / BigInt(token0Amount);
    console.log("🚀 ~ ratio1:", ratio)
    const amountOut = (ratio * BigInt(token1Amount)) / BigInt(1000000000)
    const returnOut = fromBigInt(amountOut, token1Decimals)
    return returnOut;
  } else {
    const tokenAmount = toBigInt(amount, token1Decimals);
    const ratio = (tokenAmount * BigInt(1000000000)) / BigInt(token1Amount);
    console.log("🚀 ~ ratio:", ratio)
    const amountOut = (ratio * BigInt(token0Amount)) / BigInt(1000000000)
    const returnOut = fromBigInt(amountOut, token0Decimals)
    return returnOut;
  }
}

export const calculateSwapAmounts = async (
  wallet: WalletContextState,
  address0: string,
  address1: string,
  poolAddress: PublicKey,
  amount: number,
) => {
  try {
    const anchorWallet = convertWallet(wallet);
    const provider = new anchor.AnchorProvider(connection, anchorWallet, { preflightCommitment: commitmentLevel });
    anchor.setProvider(provider);
    const program = new Program<RaydiumCpSwap>(
      raydiumCpSwapIdl as RaydiumCpSwap,
      provider
    );

    // Get pool state and config
    const [configAddr] = await PublicKey.findProgramAddress(
      [Buffer.from(AMM_CONFIG_SEED), u16ToBytes(0)],
      program.programId
    );
    
    const poolState = await program.account.poolState.fetch(poolAddress);
    const configData = await program.account.ammConfig.fetch(configAddr);
    
    // Get token decimals
    const token0Decimals = poolState.mint0Decimals;
    const token1Decimals = poolState.mint1Decimals;
    
    // Get current pool balances
    const token0Info = await connection.getTokenAccountBalance(poolState.token0Vault);
    const token1Info = await connection.getTokenAccountBalance(poolState.token1Vault);
    
    const token0Amount = BigInt(token0Info.value.amount);
    const token1Amount = BigInt(token1Info.value.amount);

    // Get fee rates from config
    const tradeFeeRate = configData.tradeFeeRate.toNumber();
    console.log("🚀 ~ tradeFeeRate:", tradeFeeRate);
    const protocolFeeRate = configData.protocolFeeRate.toNumber();
    console.log("🚀 ~ protocolFeeRate:", protocolFeeRate);
    const fundFeeRate = configData.fundFeeRate.toNumber();
    console.log("🚀 ~ fundFeeRate:", fundFeeRate);

    if (address0 === poolState.token0Mint.toBase58()) {
      // Swap token0 to token1
      const inputAmount = toBigInt(amount, token0Decimals);
      
      // Calculate fees (in basis points, so divide by 10000)
      const tradeFee = (inputAmount * BigInt(tradeFeeRate)) / BigInt(10000);
      const protocolFee = (tradeFee * BigInt(protocolFeeRate)) / BigInt(10000);
      const fundFee = (tradeFee * BigInt(fundFeeRate)) / BigInt(10000);
      
      // Calculate actual input amount after fees
      const actualAmountIn = inputAmount - tradeFee - protocolFee - fundFee;
      
      // Calculate output using constant product formula: x * y = k
      const constantBefore = token0Amount * token1Amount;
      const newToken0Amount = token0Amount + actualAmountIn;
      const newToken1Amount = constantBefore / newToken0Amount;
      const outputAmount = token1Amount - newToken1Amount;
      
      // Convert back to decimal
      const returnOut = fromBigInt(outputAmount, token1Decimals);
      
      return {
        outputAmount: returnOut,
        tradeFee: fromBigInt(tradeFee, token0Decimals),
        protocolFee: fromBigInt(protocolFee, token0Decimals),
        fundFee: fromBigInt(fundFee, token0Decimals),
        priceImpact: ((returnOut / amount) * 100).toFixed(2) + "%"
      };
    } else {
      // Swap token1 to token0
      const inputAmount = toBigInt(amount, token1Decimals);
      
      // Calculate fees
      const tradeFee = (inputAmount * BigInt(tradeFeeRate)) / BigInt(10000);
      const protocolFee = (tradeFee * BigInt(protocolFeeRate)) / BigInt(10000);
      const fundFee = (tradeFee * BigInt(fundFeeRate)) / BigInt(10000);
      
      // Calculate actual input amount after fees
      const actualAmountIn = inputAmount - tradeFee - protocolFee - fundFee;
      
      // Calculate output using constant product formula: x * y = k
      const constantBefore = token0Amount * token1Amount;
      const newToken1Amount = token1Amount + actualAmountIn;
      const newToken0Amount = constantBefore / newToken1Amount;
      const outputAmount = token0Amount - newToken0Amount;
      
      // Convert back to decimal
      const returnOut = fromBigInt(outputAmount, token0Decimals);
      
      return {
        outputAmount: returnOut,
        tradeFee: fromBigInt(tradeFee, token1Decimals),
        protocolFee: fromBigInt(protocolFee, token1Decimals),
        fundFee: fromBigInt(fundFee, token1Decimals),
        priceImpact: ((returnOut / amount) * 100).toFixed(2) + "%"
      };
    }
  } catch (error) {
    console.error("Error calculating swap amounts:", error);
    return {
      outputAmount: 0,
      tradeFee: 0,
      protocolFee: 0,
      fundFee: 0,
      priceImpact: "0%"
    };
  }
}