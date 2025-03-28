
import {
  TransactionInstruction,
  Transaction,
  PublicKey,
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  sendAndConfirmTransaction
} from "@solana/web3.js";

import { ASSOCIATED_TOKEN_PROGRAM_ID, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, createMint, ExtensionType, getMintLen, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
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
  // const transferFeeConfigAuthority = Keypair.generate();
  const transferFeeConfigAuthority = new PublicKey("H7YMxhKgLw2NDM9WQnpcUefPvCaLJCCYYaq1ETLHXJuH");

  console.log("🚀 ~ transferFeeConfigAuthority:", transferFeeConfigAuthority.toBase58())
  // const withdrawWithheldAuthority = Keypair.generate();
  const withdrawWithheldAuthority = new PublicKey("H7YMxhKgLw2NDM9WQnpcUefPvCaLJCCYYaq1ETLHXJuH");

  console.log("🚀 ~ withdrawWithheldAuthority:", withdrawWithheldAuthority.toBase58())

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
      transferFeeConfigAuthority,
      withdrawWithheldAuthority,
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

// export const create2022TokenWithMetadata = async (
//   payer: Keypair,
//   token: UserToken,
//   feeBasisPoints: number,
//   maxFee: bigint
// ): Promise<{ mint: PublicKey, amount: bigint } | undefined> => {
//   try {
//       // Calculate the minimum balance for the mint account
//       const { name, symbol, decimals, uiAmount } = token
//       const metadataUri = await generateMetadataUri(token)
//       if (!metadataUri) {
//           console.log("Metadata failed to upload")
//           return
//       }

//       const walletPk = payer.publicKey
//       const mintKp = Keypair.generate();
//       const mint = mintKp.publicKey

//       // Authority that can mint new tokens
//       const mintAuthority = walletPk;
//       // Authority that can modify transfer fees
//       const transferFeeConfigAuthority = payer;
//       // Authority that can move tokens withheld on mint or token accounts
//       const withdrawWithheldAuthority = payer;

//       // Size of Mint Account with extensions
//       const tokenAta = await getAssociatedTokenAddress(mint, walletPk, undefined, TOKEN_2022_PROGRAM_ID)
//       const amount = BigInt(new BN(uiAmount).mul(new BN(10 ** decimals)).toString())
//       const mintLen = getMintLen([
//           ExtensionType.TransferFeeConfig, ExtensionType.MetadataPointer
//       ]);
//       const tokenMetadata: TokenMetadata = {
//           updateAuthority: walletPk,
//           mint: mint,
//           name,
//           symbol,
//           uri: metadataUri, // URI to a richer metadata
//           additionalMetadata: [],
//       };
//       const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(tokenMetadata).length;
//       const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);

//       // Add instructions to new transaction
//       const transaction = new Transaction().add(
//           ComputeBudgetProgram.setComputeUnitPrice({
//               microLamports: 60_000,
//           }),
//           ComputeBudgetProgram.setComputeUnitLimit({
//               units: 200_000,
//           }),
//           SystemProgram.createAccount({
//               fromPubkey: payer.publicKey, // Account that will transfer lamports to created account
//               newAccountPubkey: mint, // Address of the account to create
//               space: mintLen, // Amount of bytes to allocate to the created account
//               lamports: mintLamports, // Amount of lamports transferred to created account
//               programId: TOKEN_2022_PROGRAM_ID, // Program assigned as owner of created account
//           }),
//           createInitializeMetadataPointerInstruction(
//               mint,
//               walletPk,
//               mint,
//               TOKEN_2022_PROGRAM_ID,
//           ),
//           createInitializeTransferFeeConfigInstruction(
//               mint, // Mint Account address
//               transferFeeConfigAuthority.publicKey, // Authority to update fees
//               withdrawWithheldAuthority.publicKey, // Authority to withdraw fees
//               feeBasisPoints, // Basis points for transfer fee calculation
//               maxFee, // Maximum fee per transfer
//               TOKEN_2022_PROGRAM_ID // Token Extension Program ID
//           ),
//           createInitializeMintInstruction(
//               mint, // Mint Account Address
//               decimals, // Decimals of Mint
//               mintAuthority, // Designated Mint Authority
//               null, // Optional Freeze Authority
//               TOKEN_2022_PROGRAM_ID // Token Extension Program ID
//           ),
//           createInitializeInstruction({
//               metadata: mint,
//               updateAuthority: walletPk,
//               mint: mint,
//               mintAuthority: walletPk,
//               name: name,
//               symbol: symbol,
//               uri: metadataUri,
//               programId: TOKEN_2022_PROGRAM_ID,
//           }),
//           createAssociatedTokenAccountInstruction(walletPk, tokenAta, walletPk, mint, TOKEN_2022_PROGRAM_ID),
//           createMintToInstruction(mint, tokenAta, walletPk, amount, [], TOKEN_2022_PROGRAM_ID),
//       );
//       transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
//       transaction.feePayer = walletPk
//       // console.log(await connection.simulateTransaction(transaction))
//       const sig = await sendAndConfirmTransaction(connection, transaction, [payer, mintKp], { skipPreflight: true, commitment: "finalized" })
//       console.log(`Token2022 is created: https://solscan.io/tx/${sig}${cluster == "devnet" ? "?cluster=devnet" : ""}`)
//       console.log(`Token2022 contract link: https://solscan.io/token/${mint}${cluster == "devnet" ? "?cluster=devnet" : ""}`)
//       return { mint, amount }

//   } catch (error) {
//       console.log("Create token error")
//       return
//   }
// }

// export const generateMetadataUri = async (token: UserToken) => {
//   try {
//       const { name, symbol, description, image } = token
//       const number = Date.now()
//       const imageHash = await uploadToIPFS(image);
//       console.log(Date.now() - number, "ms to upload to IPFS")
//       console.log(`Image link: https://gateway.pinata.cloud/ipfs/${imageHash}`)

//       // Prepare metadata
//       const metadata: Metadata = {
//           name,
//           symbol,
//           description,
//           image: `https://gateway.pinata.cloud/ipfs/${imageHash}`,
//       };

//       if (token.extensions)
//           metadata.extensions = token.extensions
//       if (token.tags)
//           metadata.tags = token.tags
//       if (token.creator)
//           metadata.creator = token.creator
//       // Upload metadata to IPFS
//       const metadataHash = await uploadMetadata(metadata);
//       const metadataUri = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;
//       console.log(`Metadata uploaded: ${metadataUri}`);

//       return metadataUri
//   } catch (error) {
//       console.log("Error while uploading meatadata")
//   }
// }
