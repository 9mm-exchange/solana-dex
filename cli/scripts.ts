import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import fs from "fs";

import { Keypair, Connection, PublicKey } from "@solana/web3.js";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import { RaydiumCpSwap } from "../target/types/raydium_cp_swap";
import {
  createConfigTx,
} from "../lib/scripts";
import { execTx } from "../lib/util";
import {
  TEST_INDEX,
  TEST_TRADE_FEE_RATE,
  TEST_PROTOCOL_FEE_RATE,
  TEST_FUND_FEE_RATE,
} from "../lib/constant";

let solConnection: Connection = null;
let program: Program<RaydiumCpSwap> = null;
let payer: NodeWallet = null;

/**
 * Set cluster, provider, program
 * If rpc != null use rpc, otherwise use cluster param
 * @param cluster - cluster ex. mainnet-beta, devnet ...
 * @param keypair - wallet keypair
 * @param rpc - rpc
 */
export const setClusterConfig = async (
  cluster: web3.Cluster,
  keypair: string,
  rpc?: string
) => {
  if (!rpc) {
    solConnection = new web3.Connection(web3.clusterApiUrl(cluster));
  } else {
    solConnection = new web3.Connection(rpc);
  }

  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(keypair, "utf-8"))),
    { skipValidation: true }
  );
  payer = new NodeWallet(walletKeypair);

  console.log("Wallet Address: ", payer.publicKey.toBase58());

  anchor.setProvider(
    new anchor.AnchorProvider(solConnection, payer, {
      skipPreflight: true,
      commitment: "confirmed",
    })
  );

  // Generate the program client from IDL.
  program = anchor.workspace.RaydiumCpSwap as Program<RaydiumCpSwap>;

  console.log("ProgramId: ", program.programId.toBase58());
};

export const configProject = async () => {

  const tx = await createConfigTx(
    payer.publicKey,

    TEST_INDEX,
    TEST_TRADE_FEE_RATE,
    TEST_PROTOCOL_FEE_RATE,
    TEST_FUND_FEE_RATE,
    solConnection,
    program
  );

  await execTx(tx, solConnection, payer);
};

// export const launchToken = async () => {
//   const tx = await launchTokenTx(
//     TEST_DECIMALS,
//     TEST_TOKEN_SUPPLY,
//     TEST_VIRTUAL_RESERVES,

//     //  metadata
//     TEST_NAME,
//     TEST_SYMBOL,
//     TEST_URI,

//     payer.publicKey,

//     solConnection,
//     program
//   );

//   await execTx(tx, solConnection, payer);
// };

// export const swap = async (
//   token: PublicKey,

//   amount: number,
//   style: number
// ) => {
//   const tx = await swapTx(
//     payer.publicKey,
//     token,
//     amount,
//     style,
//     solConnection,
//     program
//   );

//   await execTx(tx, solConnection, payer);
// };

// export const withdraw = async (token: PublicKey) => {
//   const tx = await withdrawTx(payer.publicKey, token, solConnection, program);

//   await execTx(tx, solConnection, payer);
// };
