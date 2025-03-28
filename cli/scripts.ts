import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import fs from "fs";

import { Keypair, Connection, PublicKey } from "@solana/web3.js";

import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";

import { RaydiumCpSwap } from "../target/types/raydium_cp_swap";
import {
  createConfigTx,
  depositTx,
  initializeTx,
  swapTx,
  withdrawTx,
  updateAmmConfigTx,
  collectProtocolFeeTx
} from "../lib/scripts";
import { execTx } from "../lib/util";
import {
  TEST_INDEX,
  TEST_TRADE_FEE_RATE,
  TEST_PROTOCOL_FEE_RATE,
  TEST_FUND_FEE_RATE,
  TEST_INITIAL_AMOUNT_1,
  TEST_INITIAL_AMOUNT_0,
} from "../lib/constant";
import { TOKEN_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

let solConnection: Connection = null;
let program: Program<RaydiumCpSwap> = null;
let payer: NodeWallet = null;
let creator: NodeWallet = null;

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
  creatorPath: string,
  rpc?: string,
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

  const creatorKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(creatorPath, "utf-8"))),
    { skipValidation: true }
  )

  creator = new NodeWallet(creatorKeypair);
  console.log("creator: ", creator.publicKey.toBase58());

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

export const updateConfig = async (param: number, value: number) => {

  const tx = await updateAmmConfigTx(
    payer.publicKey,

    param,
    value,

    solConnection,
    program
  );

  await execTx(tx, solConnection, payer);
}

export const createPool = async () => {

  const tx = await initializeTx(
    payer,
    payer,

    TEST_INDEX,

    TEST_INITIAL_AMOUNT_0,
    TEST_INITIAL_AMOUNT_1,

    solConnection,
    program
  );

  await execTx(tx, solConnection, payer);
}

export const deposite = async (
  token0: PublicKey,
  token1: PublicKey,
  lpAmount: number,
  token0Amount: number,
  token1Amount: number
) => {

  const tx = await depositTx(
    creator,

    token0,
    token1,
    TEST_INDEX,
    lpAmount,
    token0Amount,
    token1Amount,

    solConnection,
    program
  )

  await execTx(tx, solConnection, creator);
}

export const swap = async(
  token0: PublicKey,
  token1: PublicKey,
  amount: number,
  direction: number
) => {

  const tx = await swapTx(
    creator,

    token0,
    token1,
    TEST_INDEX,
    amount,
    direction,

    solConnection,
    program
  )

  await execTx(tx, solConnection, creator);
}

export const withdraw = async(
  token0: PublicKey,
  token1: PublicKey,
  lpAmount: number,
  token0Amount: number,
  token1Amount: number
) => {
  const tx = await withdrawTx(
    creator,

    TEST_INDEX,
    token0,
    token1,
    token0Amount,
    token1Amount,
    lpAmount,

    solConnection,
    program
  )

  await execTx(tx, solConnection, creator);
}

export const collectFundFee = async (
  token0: PublicKey,
  token1: PublicKey,
  token0Amount: number,
  token1Amount: number
) => {
  const tx = await collectProtocolFeeTx(
    creator.publicKey,

    token0,
    token1,
    TEST_INDEX,
    token0Amount,
    token1Amount,

    solConnection,
    program
  )

  await execTx(tx, solConnection, creator);
}