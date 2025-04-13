import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import {
  Connection,
  Transaction,
  AddressLookupTableAccount,
  TransactionInstruction,
  VersionedTransaction,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
  Keypair,
  ParsedAccountData
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
  getTransferFeeAmount,
  createTransferCheckedInstruction,
  createAssociatedTokenAccountIdempotentInstruction, createWithdrawWithheldTokensFromAccountsInstruction
} from "@solana/spl-token";
import { connection } from "../program/web3";
import base58 from "bs58";
import Pool from "../models/Pool";
import Token2022 from "../models/Token2022";

export const execTx = async (
  transaction: Transaction,
  connection: Connection,
  payer: NodeWallet,
  commitment: "confirmed" | "finalized" = 'confirmed'
) => {
  try {
    console.log(await connection.simulateTransaction(transaction));

    //  Sign the transaction with payer wallet
    const signedTx = await payer.signTransaction(transaction);

    // Serialize, send and confirm the transaction
    const rawTransaction = signedTx.serialize()

    // return;
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
      preflightCommitment: "processed"
    });
    console.log(`https://solscan.io/tx/${txid}?cluster=custom&customUrl=${connection.rpcEndpoint}`);

    const confirmed = await connection.confirmTransaction(txid, commitment);

    console.log("err ", confirmed.value.err);

    return txid;
  } catch (e) {
    console.log("Error while executing transaction", e);
  }

  return null;
}

export const fetchTokenAccounts = async (connection: Connection, mint: PublicKey) => {
  try {
    const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      commitment: 'confirmed',
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: mint.toString(),
          },
        },
      ],
    });
    const accountsToWithdrawFrom: PublicKey[] = [];
    for (const accountInfo of allAccounts) {
      const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
      const transferFeeAmount = getTransferFeeAmount(account);
      if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > BigInt(0)) {
        accountsToWithdrawFrom.push(accountInfo.pubkey);
      }
    }
    return accountsToWithdrawFrom
  } catch (error) {
    console.log("Error while fetching all token accounts of 2022 token", error)
  }
}

export const fetchHolders = async (connection: Connection, mint: PublicKey) => {
  try {
    const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      commitment: 'confirmed',
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: mint.toString(),
          },
        },
      ],
    });
    const holders: HolderInfo[] = [];
    for (const accountInfo of allAccounts) {
      const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
      const isOnCurve = PublicKey.isOnCurve(account.owner)
      if (account.amount > BigInt(0) && !account.isFrozen && isOnCurve)
        holders.push({
          pubkey: account.owner,
          amount: account.amount,
        });
    }
    return holders
  } catch (error) {
    console.log("Error while fetching all token accounts of 2022 token", error)
  }
}

interface HolderInfo {
  pubkey: PublicKey,
  amount: bigint
}

export const withdrawWithheldTokens = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  withdrawWithheldAuthority: Keypair,
  accounts: PublicKey[],
  feeWallet: PublicKey
) => {
  console.log("🚀 ~ withdrawWithheldTokens ~ withdrawWithheldAuthority:", withdrawWithheldAuthority.publicKey.toBase58())
  try {
    const feeWalletAta = getAssociatedTokenAddressSync(mint, feeWallet, undefined, TOKEN_2022_PROGRAM_ID);
    const accountChunks = splitArrayIntoChunks(accounts, 20);

    // Iterate over each chunk with a delay of 1 second between each chunk
    await Promise.all(
      accountChunks.map(async (chunk, index) => {
        // Introduce the delay of 1 second per chunk using a timeout
        await sleep(1000 * index)

        const tx = new Transaction().add(
          ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
          createAssociatedTokenAccountIdempotentInstruction(
            payer.publicKey,
            feeWalletAta,
            feeWallet,
            mint,
            TOKEN_2022_PROGRAM_ID
          ),
          createWithdrawWithheldTokensFromAccountsInstruction(
            mint,
            feeWalletAta,
            withdrawWithheldAuthority.publicKey,
            [withdrawWithheldAuthority.publicKey],
            chunk,
            TOKEN_2022_PROGRAM_ID
          )
        )
        tx.feePayer = payer.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        console.log(await connection.simulateTransaction(tx))
        const sig = await sendAndConfirmTransaction(connection, tx, [payer, withdrawWithheldAuthority])
        console.log("🚀 ~ accountChunks.map ~ sig:", sig)
        console.log(`Withdraw withheld token signature : https://solscan.io/tx/${sig}?cluster=devnet`)
      })
    );
  } catch (error) {
    console.log("Error while withdrawing withheld tokens : ", error)
  }
};

export const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export const distributeFeeToHolders = async (connection: Connection, holders: HolderInfo[], feeWalletKp: Keypair, mint: PublicKey, tokenDecimal: number) => {
  try {
    const srcAta = getAssociatedTokenAddressSync(
      mint,
      feeWalletKp.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    const amountToDistribute = (await connection.getTokenAccountBalance(srcAta)).value.amount
    const totalHoldings = holders.reduce((acc, holder) => acc + holder.amount, BigInt(0));
    if (totalHoldings === BigInt(0)) {
      throw new Error("Total holdings of all holders is zero! Cannot distribute fees.");
    }

    const holdersWithBalance = holders.filter((holder) => {
      const tokenAmount = (holder.amount * BigInt(amountToDistribute)) / totalHoldings;
      return tokenAmount > BigInt(0);
    });
    console.log("Holder number is ", holdersWithBalance.length)
    const holderChunks = splitArrayIntoChunks(holdersWithBalance, 8);

    await Promise.all(
      holderChunks.map(async (chunk: HolderInfo[], index: number) => {
        await sleep(1000 * index);
        const ixs: TransactionInstruction[] = [];
        ixs.push(
          ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
          ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 })
        );

        chunk.map((holder: HolderInfo) => {
          const tokenAmount = (holder.amount * BigInt(amountToDistribute.toString())) / totalHoldings;
          const destAta = getAssociatedTokenAddressSync(
            mint,
            holder.pubkey,
            undefined,
            TOKEN_2022_PROGRAM_ID
          );

          if (tokenAmount > BigInt(0)) {
            ixs.push(
              createAssociatedTokenAccountIdempotentInstruction(
                feeWalletKp.publicKey,
                destAta,
                holder.pubkey,
                mint,
                TOKEN_2022_PROGRAM_ID
              ),
              createTransferCheckedInstruction(
                srcAta,
                mint,
                destAta,
                feeWalletKp.publicKey,
                tokenAmount,
                tokenDecimal,
                [],
                TOKEN_2022_PROGRAM_ID
              )
            );
          }
        });

        // Create the transaction with all instructions
        const transaction = new Transaction().add(...ixs);
        transaction.feePayer = feeWalletKp.publicKey;
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        // console.log(await connection.simulateTransaction(transaction));
        const signature = await sendAndConfirmTransaction(connection, transaction, [feeWalletKp]);
        console.log(`Distributed fees to holders. Signature: https://solscan.io/tx/${signature}?cluster=devnet`);
      })
    );
    console.log("Fee distribution completed successfully.");
  } catch (error) {
    console.log("Error in distributing fee to holders : ", error)
  }
}


export const transferFeeToCreator = async (connection: Connection, feeWalletKp: Keypair, creator: PublicKey) => {
  try {
    const bal = await connection.getBalance(feeWalletKp.publicKey)
    if (bal < 2 * 10 ** 7) {
      console.log("Fee reward is smaller than 0.02SOL, skipping reward distribution")
    }
    const transaction = new Transaction().add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
      SystemProgram.transfer({
        fromPubkey: feeWalletKp.publicKey,
        toPubkey: creator,
        lamports: bal - 2 * 10 ** 7
      })
    )

    transaction.feePayer = feeWalletKp.publicKey;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    const signature = await sendAndConfirmTransaction(connection, transaction, [feeWalletKp]);
    console.log(`Distributed fee to creator. Signature: https://solscan.io/tx/${signature}?cluster=devnet`);
  } catch (error) {
    console.log("Error in transferring fee to creator")
    return
  }
}

// Helper function to split the array into chunks of a specific size
const splitArrayIntoChunks = (array: any[], chunkSize: number): any[][] => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
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

    console.log("Failed to retrieve mint account info");
    return TOKEN_PROGRAM_ID;
  } catch (error) {
    console.log("Error fetching token standard:", error);
    return null;
  }
};

const distributeFee = async (connection: Connection, baseMint: PublicKey, creator: PublicKey) => {
  console.log("Distribution working now, ", baseMint.toBase58())
  const feeWalletKp = Keypair.fromSecretKey(base58.decode(process.env.DISTRIBUTION_WALLET_PRIVATEKEY))
  const feeWallet = feeWalletKp.publicKey
  console.log("🚀 ~ distributeFee ~ feeWallet:", feeWallet)
  const withdrawAuthority = Keypair.fromSecretKey(base58.decode(process.env.WITHDRAW_AUTHORITY))
  const accounts = await fetchTokenAccounts(connection, baseMint)
  await withdrawWithheldTokens(connection, feeWalletKp, baseMint, withdrawAuthority, accounts, feeWallet)


  // distributing reward to specific token holders
  const holders = await fetchHolders(connection, new PublicKey(process.env.TOKEN))
  console.log("🚀 ~ distributeFee ~ holders:", holders)
  if (!holders) {
    console.log("No holders with holding percent")
    return
  }

  // console.log("\n\n========================== Distributing fees to token holding wallets =========================\n")
  await distributeFeeToHolders(connection, holders, feeWalletKp, baseMint, 6)

  if (!accounts) {
    console.log("No accounts with fee")
    return
  }

  // here, sends the fee from the tax token to creator
  // transferFeeToCreator(connection, feeWalletKp, creator)

}

export const runFeeDistributer = async () => {
  setInterval(async () => {
    const tokens = await Token2022.find({}).select('mint') as any;
    console.log("tokens data fetched from db: ", tokens)

    const tokenlist = tokens.reduce((list, token) => {
      if (token.mint) list.push(token.mint)
      return list
    }, [])
    console.log("🚀 ~ tokenlist ~ tokenlist:", tokenlist)
    
    if (tokenlist && tokenlist.length > 0) {
      tokenlist.map(async (token) => {
        distributeFee(connection, new PublicKey(token), new PublicKey(token))
      })
    }
    // if (tokenlist && tokenlist.length > 0)
    //   tokenlist.map(token => {
    //     if (!token.creator) {
    //       console.log("Token creator not fetched from users list")
    //       return
    //     }
    //     distributeFee(connection, new PublicKey(token.token0Mint), new PublicKey(token.creator))
    //   })
  }, 86400_000)
}