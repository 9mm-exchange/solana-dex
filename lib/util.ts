
import {
  AddressLookupTableAccount,
  TransactionInstruction,
  VersionedTransaction,
  Transaction,
  PublicKey,
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  LAMPORTS_PER_SOL,
  Keypair,
  sendAndConfirmTransaction
} from "@solana/web3.js";

import { ASSOCIATED_TOKEN_PROGRAM_ID, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, createMint, ExtensionType, getMintLen, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { web3 } from "@coral-xyz/anchor";
import { keypair } from '../../Pumpfun-sniper-grpc-down/index';
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

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

export const execTx = async (
  transaction: Transaction,
  connection: Connection,
  payer: NodeWallet,
  commitment: "confirmed" | "finalized" = 'confirmed'
) => {
  try {
    //  Sign the transaction with payer wallet
    const signedTx = await payer.signTransaction(transaction);

    // Serialize, send and confirm the transaction
    const rawTransaction = signedTx.serialize()

    console.log(await connection.simulateTransaction(signedTx));

    // return;
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
      preflightCommitment: "processed"
    });
    console.log(`https://solscan.io/tx/${txid}?cluster=custom&customUrl=${connection.rpcEndpoint}`);

    const confirmed = await connection.confirmTransaction(txid, commitment);

    console.log("err ", confirmed.value.err)
  } catch (e) {
    console.log(e);
  }
}

export const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey
) => {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
    { pubkey: walletAddress, isSigner: false, isWritable: false },
    { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data: Buffer.from([]),
  });
};

export const getATokenAccountsNeedCreate = async (
  connection: Connection,
  walletAddress: PublicKey,
  owner: PublicKey,
  nfts: PublicKey[],
) => {
  const instructions = []; const destinationAccounts = [];
  for (const mint of nfts) {
    const destinationPubkey = getAssociatedTokenAccount(owner, mint);
    let response = await connection.getAccountInfo(destinationPubkey);
    if (!response) {
      const createATAIx = createAssociatedTokenAccountInstruction(
        destinationPubkey,
        walletAddress,
        owner,
        mint,
      );
      instructions.push(createATAIx);
    }
    destinationAccounts.push(destinationPubkey);
    if (walletAddress != owner) {
      const userAccount = getAssociatedTokenAccount(walletAddress, mint);
      response = await connection.getAccountInfo(userAccount);
      if (!response) {
        const createATAIx = createAssociatedTokenAccountInstruction(
          userAccount,
          walletAddress,
          walletAddress,
          mint,
        );
        instructions.push(createATAIx);
      }
    }
  }
  return {
    instructions,
    destinationAccounts,
  };
};

export function u16ToBytes(num: number) {
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setUint16(0, num, false);
  return new Uint8Array(arr);
}

export async function createTokenMintAndAssociatedTokenAccount(
  connection: Connection,
  payer: NodeWallet,
  mintAuthority: NodeWallet,
  transferFeeConfig: { transferFeeBasisPoints: number; MaxFee: number }
) {

  let ixs: TransactionInstruction[] = [];
  ixs.push(
    web3.SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: mintAuthority.publicKey,
      lamports: LAMPORTS_PER_SOL,
    })
  );
  const tx = new Transaction().add(...ixs);
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  await execTx(tx, connection, payer);

  interface Token {
    address: PublicKey;
    program: PublicKey;
  }

  let tokenArray: Token[] = [];
  let token0 = await createMint(
    connection,
    payer.payer,
    mintAuthority.publicKey,
    null,
    9
  );

  tokenArray.push({ address: token0, program: TOKEN_PROGRAM_ID });

  const token1MintKeypair = Keypair.generate();
  let token1 = await createMintWithTransferFee(
    connection,
    payer,
    mintAuthority,
    token1MintKeypair,
    transferFeeConfig
  );
  console.log("🚀 ~ token1:", token1.toBase58())

  tokenArray.push({ address: token1, program: TOKEN_2022_PROGRAM_ID });

  tokenArray.sort(function (x, y) {
    if (x.address < y.address) {
      return -1;
    }
    if (x.address > y.address) {
      return 1;
    }
    return 0;
  });

  token0 = tokenArray[0].address;
  token1 = tokenArray[1].address;
  console.log("Token 0", token0.toString());
  console.log("Token 1", token1.toString());

  const token0Program = tokenArray[0].program;
  const token1Program = tokenArray[1].program;

  console.log(2);
  const ownerToken0Account = await getOrCreateAssociatedTokenAccount(
    connection,
    payer.payer,
    token0,
    payer.publicKey,
    false,
    "confirmed",
    { skipPreflight: true },
    token0Program,
    ASSOCIATED_PROGRAM_ID
  );
  console.log("ownerToken0Account: ", ownerToken0Account.address.toBase58());

  await mintTo(
    connection,
    mintAuthority.payer,
    token0,
    ownerToken0Account.address,
    mintAuthority.publicKey,
    100_000_000_000_000,
    [mintAuthority.payer],
    { skipPreflight: true },
    token0Program
  );

  const ownerToken1Account = await getOrCreateAssociatedTokenAccount(
    connection,
    payer.payer,
    token1,
    payer.publicKey,
    false,
    "processed",
    { skipPreflight: true },
    token1Program,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  console.log(
    "ownerToken1Account key: ",
    ownerToken1Account.address.toString()
  );
  await mintTo(
    connection,
    mintAuthority.payer,
    token1,
    ownerToken1Account.address,
    mintAuthority.publicKey,
    100_000_000_000_000,
    [],
    { skipPreflight: true },
    token1Program
  );

  return [
    { token0, token0Program },
    { token1, token1Program },
  ];
}


async function createMintWithTransferFee(
  connection: Connection,
  payer: NodeWallet,
  mintAuthority: NodeWallet,
  mintKeypair = Keypair.generate(),
  transferFeeConfig: { transferFeeBasisPoints: number; MaxFee: number }
) {
  console.log(3);
  const transferFeeConfigAuthority = Keypair.generate();
  console.log("🚀 ~ transferFeeConfigAuthority:", transferFeeConfigAuthority.publicKey.toBase58())
  const withdrawWithheldAuthority = Keypair.generate();
  console.log("🚀 ~ withdrawWithheldAuthority:", withdrawWithheldAuthority.publicKey.toBase58())

  const extensions = [ExtensionType.TransferFeeConfig];

  const mintLen = getMintLen(extensions);
  const decimals = 9;

  const mintLamports = await connection.getMinimumBalanceForRentExemption(
    mintLen
  );
  const mintTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports: mintLamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferFeeConfigInstruction(
      mintKeypair.publicKey,
      transferFeeConfigAuthority.publicKey,
      withdrawWithheldAuthority.publicKey,
      transferFeeConfig.transferFeeBasisPoints,
      BigInt(transferFeeConfig.MaxFee),
      TOKEN_2022_PROGRAM_ID
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      mintAuthority.publicKey,
      null,
      TOKEN_2022_PROGRAM_ID
    )
  );
  mintTransaction.feePayer = payer.publicKey;
  mintTransaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;

  const sig = await sendAndConfirmTransaction(connection, mintTransaction, [mintKeypair, payer.payer])
  console.log(`Sig for token mint: https://solscan.io/tx/${sig}?cluster=custom&customUrl=${connection.rpcEndpoint}`);

  return mintKeypair.publicKey;
}