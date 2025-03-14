
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
    Keypair
} from "@solana/web3.js";

import { ASSOCIATED_TOKEN_PROGRAM_ID, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, createMint, ExtensionType, getMintLen, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

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
    mintAuthority: Keypair,
    transferFeeConfig: { transferFeeBasisPoints: number; MaxFee: number }
  ) {
    let Tx = new Transaction();
    Tx.add(
      SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: mintAuthority.publicKey,
        lamports: LAMPORTS_PER_SOL,
      })
    );
    await execTx(Tx, connection, payer);
  
    interface Token {
      address: PublicKey;
      program: PublicKey;
    }
  
    let tokenArray: Token[] = [];
    let token0 = await createMint(
      connection,
      mintAuthority,
      mintAuthority.publicKey,
      null,
      9
    );
    tokenArray.push({ address: token0, program: TOKEN_PROGRAM_ID });
  
    let token1 = await createMintWithTransferFee(
      connection,
      payer,
      mintAuthority,
      Keypair.generate(),
      transferFeeConfig
    );
  
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
    //   console.log("Token 0", token0.toString());
    //   console.log("Token 1", token1.toString());
    const token0Program = tokenArray[0].program;
    const token1Program = tokenArray[1].program;
  
    const ownerToken0Account = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      token0,
      payer.publicKey,
      false,
      "processed",
      { skipPreflight: true },
      token0Program
    );
  
    await mintTo(
      connection,
      payer.payer,
      token0,
      ownerToken0Account.address,
      mintAuthority.publicKey,
      100_000_000_000_000,
      [],
      { skipPreflight: true },
      token0Program
    );
  
    // console.log(
    //   "ownerToken0Account key: ",
    //   ownerToken0Account.address.toString()
    // );
  
    const ownerToken1Account = await getOrCreateAssociatedTokenAccount(
      connection,
      payer.payer,
      token1,
      payer.publicKey,
      false,
      "processed",
      { skipPreflight: true },
      token1Program
    );
    // console.log(
    //   "ownerToken1Account key: ",
    //   ownerToken1Account.address.toString()
    // );
    await mintTo(
      connection,
      payer.payer,
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
    mintAuthority: Keypair,
    mintKeypair = Keypair.generate(),
    transferFeeConfig: { transferFeeBasisPoints: number; MaxFee: number }
  ) {
    const transferFeeConfigAuthority = Keypair.generate();
    const withdrawWithheldAuthority = Keypair.generate();
  
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
    const tx = await execTx(mintTransaction, connection, payer);

    return mintKeypair.publicKey;
  }