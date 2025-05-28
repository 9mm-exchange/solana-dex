import { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, Transaction } from "@solana/web3.js";

export const execTx = async (
  transaction: Transaction,
  connection: Connection,
  payer: WalletContextState,
  commitment: "confirmed" | "finalized" = 'confirmed'
) => {
  try {
      //  Sign the transaction with payer wallet
      const signedTx = await payer.signTransaction!(transaction);

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
      
      try {
        const confirmed = await connection.confirmTransaction(txid, commitment);
        console.log("err ", confirmed.value.err);
        if(confirmed.value.err === null) {
          return {txid};
        } else {
          return null;
        }
      } catch (error) {
        console.log("confirm error: ", error);
        return error
      }
  } catch (e) {
      console.log("confirm transaction error: ", e);
      return e;
  }

  return null;
}