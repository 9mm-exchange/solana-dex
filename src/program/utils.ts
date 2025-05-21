import {
  AccountMeta,
  AddressLookupTableAccount,
  Connection,
  Keypair,
  ParsedAccountData,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from "@solana/web3.js";

import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { connection } from "./web3";

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

export const sendV0Transaction = async (
  connection: Connection,
  payer: WalletContextState,
  instructions: TransactionInstruction[],
  lookupTableAccounts?: AddressLookupTableAccount[],
  signers?: Keypair[],
  onlySimulate: boolean = false,
) => {
  // Get the latest blockhash and last valid block height
  const { lastValidBlockHeight, blockhash } = await connection.getLatestBlockhash();

  // Create a new transaction message with the provided instructions
  const messageV0 = new TransactionMessage({
    payerKey: payer.publicKey!, // The payer (i.e., the account that will pay for the transaction fees)
    recentBlockhash: blockhash, // The blockhash of the most recent block
    instructions, // The instructions to include in the transaction
  }).compileToV0Message(
    lookupTableAccounts ? lookupTableAccounts : undefined,
  );

  // Create a new transaction object with the message
  let transaction = new VersionedTransaction(messageV0);

  // Sign the transaction with the user's keypair
  if (signers && signers.length != 0) {
    transaction.sign(signers);
    transaction = await payer.signTransaction!(transaction);
  } else {
    transaction = await payer.signTransaction!(transaction);
  }
  try {
    console.log("simulate Tx: ", await connection.simulateTransaction(transaction));
    if (onlySimulate == true) {
      console.dir(await connection.simulateTransaction(transaction), { maxArrayLength: 200, colors: true });
      return;
    }

    // Send the transaction to the cluster
    const txid = await connection.sendTransaction(transaction);

    // Log the transaction URL on the Solscan
    console.log(`tx: https://solscan.io/tx/${txid}?cluster=custom&customUrl=${connection.rpcEndpoint}`);

    // Confirm the transaction
    const confirmed = await connection.confirmTransaction(
      {
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight,
        signature: txid,
      },
      "confirmed",
    );
    try {
      console.log("transaction confirmed: ", confirmed);
      return confirmed;
    } catch (error) {
      console.error(error);
      throw error;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }

}

export const bufferToArray = (buffer: Buffer): number[] => {
  const nums: number[] = [];
  for (let i = 0; i < buffer.length; i++) {
    nums.push(buffer[i]);
  }
  return nums;
}

export const mapProof = (assetProof: { proof: string[] }): AccountMeta[] => {
  if (!assetProof.proof || assetProof.proof.length === 0) {
    throw new Error("Proof is empty");
  }
  return assetProof.proof.map((node) => ({
    pubkey: new PublicKey(node),
    isSigner: false,
    isWritable: false,
  }));
};

export const getTokenDecimals = async (mint: string) => {
  try {
    const mintPubkey = new PublicKey(mint);
    const mintAccountInfo = await connection.getParsedAccountInfo(mintPubkey);

    if (mintAccountInfo && mintAccountInfo.value) {
      const accountData = mintAccountInfo.value.data;

      // Check if `accountData` is of type ParsedAccountData
      if ("parsed" in accountData) {
        const parsedData = accountData as ParsedAccountData;
        const decimals = parsedData.parsed.info.decimals;
        return decimals;
      } else {
        console.log("Account data is not parsed.");
      }
    }

    console.log("Failed to retrieve mint account info");
    return null;
  } catch (error) {
    console.log("Error fetching token decimals:", error);
    return null;
  }
};

export const checkTokenStandard = async (mint: string) => {
  
  try {
    const mintPubkey = new PublicKey(mint);
    const mintAccountInfo = await connection.getParsedAccountInfo(mintPubkey);

    if (mintAccountInfo && mintAccountInfo.value) {
      const accountData = mintAccountInfo.value.data;

      // Check if data is ParsedAccountData
      if ("program" in accountData) {
        const parsedData = accountData as ParsedAccountData;
        if (parsedData.program === "spl-token-2022") {
          return TOKEN_2022_PROGRAM_ID;
        }
      } else {
        console.log("Account data is not parsed or lacks a program field.");
      }
    }

    return TOKEN_PROGRAM_ID;
  } catch (error) {
    console.log("Error fetching token standard:", error);
    return null;
  }
};

