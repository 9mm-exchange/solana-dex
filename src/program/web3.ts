import {
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionResponse,
  clusterApiUrl
} from "@solana/web3.js";
import base58 from "bs58";
import { Types } from "mongoose";
import { AnchorProvider, Program, web3 } from "@coral-xyz/anchor";
import { RaydiumCpSwap } from "./raydium_cp_swap";
import idl from "./raydium_cp_swap.json";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import * as anchor from "@coral-xyz/anchor";
import { io } from "../sockets";
import axios from "axios";
import { Metaplex } from "@metaplex-foundation/js";
import {
  CpiGuardLayout,
  getAssociatedTokenAddressSync,
  NATIVE_MINT
} from "@solana/spl-token";
import { execTx } from "../utils/util";
import PoolModel from "../models/Pool";
import { lpDecimal } from "../utils/constant";
import PoolStatus from "../models/PoolStatus";
import { getSolPriceInUSD } from "../utils/getSolPriceInUsd";
import LiquidityStatus from "../models/LiquidityStatus";

require("dotenv").config();

export const commitmentLevel = "processed";
export const endpoint =
  process.env.PUBLIC_SOLANA_RPC || clusterApiUrl("devnet");
export const connection = new Connection(endpoint, commitmentLevel);

const privateKey = base58.decode(process.env.PRIVATE_KEY!);

export const raydiumCpSwapProgramInterface = JSON.parse(JSON.stringify(idl));

const adminKeypair = web3.Keypair.fromSecretKey(privateKey);
const adminWallet = new NodeWallet(adminKeypair);
const provider = new anchor.AnchorProvider(connection, adminWallet, {
  preflightCommitment: commitmentLevel
});
anchor.setProvider(provider);

const program = new Program(
  raydiumCpSwapProgramInterface as RaydiumCpSwap,
  provider
);

const meteplex = Metaplex.make(connection);
let token: PublicKey;

const handleCreatePoolEvent = async (event: any) => {
  console.log("CreateEvent : ", event);
  try {
    const poolAddress = event.poolId.toString();
    const creator = event.creator.toString();
    const token0Mint = event.token0Mint.toString();
    const token1Mint = event.token1Mint.toString();
    const token0Amount = event.token0Amount.toNumber();
    const token1Amount = event.token1Amount.toNumber();
    const lpMint = event.lpMint.toString();
    const liquidity = event.liquidity.toNumber();

    const solPriceInUSD = parseFloat(await getSolPriceInUSD());

    const newPool = new PoolModel({
      creator: creator,
      liquidity: liquidity,
      lpMint: lpMint,
      poolAddress: poolAddress,
      token0Mint: token0Mint,
      token1Mint: token1Mint,
      token0Amount: token0Amount,
      token1Amount: token1Amount
    });
    const response = await newPool.save();
    console.log("🚀 ~ handleCreatePoolEvent ~ response:", response);

    const newPoolStatus = new PoolStatus({
      poolId: response._id,
      record: [
        {
          holder: response.creator,
          holdingStatus: 0,
          amount: 0,
          tx: "txId"
        }
      ]
    });
    await newPoolStatus.save();
    console.log(await newPoolStatus.save());

    const newLiquidyStatus = new LiquidityStatus({
      poolId: response._id,
      record: {
        holder: response.creator,
        totalLiquidity: liquidity,
        tx: "txId"
      }
    })
    await newLiquidyStatus.save();
    console.log(await newLiquidyStatus.save());
    
    const date = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    if (io != null)
      io.emit("PoolCreated", poolAddress, event.creator.toBase58(), date);
  } catch (error) {
    console.log("Create Pool error: ", error);
  }
};

const handleSwapEvent = async (event: any) => {
  console.log("SwapEvent: ", event);
  try {
    const poolAddress = event.poolId.toString();
    console.log("🚀 ~ handleSwapEvent ~ poolAddress:", poolAddress);
    const user = event.user.toString();
    console.log("🚀 ~ handleSwapEvent ~ user:", user);
    const inputVaultBefore = event.inputVaultBefore.toNumber();
    console.log("🚀 ~ handleSwapEvent ~ inputVaultBefore:", inputVaultBefore);
    const outVaultBefore = event.outputVaultBefore.toNumber();
    console.log("🚀 ~ handleSwapEvent ~ outVaultBefore:", outVaultBefore);
    const inputAmount = event.inputAmount.toNumber();
    console.log("🚀 ~ handleSwapEvent ~ inputAmount:", inputAmount);
    const outputAmount = event.outputAmount.toNumber();
    console.log("🚀 ~ handleSwapEvent ~ outputAmount:", outputAmount);
    const inputTransferFee = event.inputTransferFee.toNumber();
    console.log("🚀 ~ handleSwapEvent ~ inputTransferFee:", inputTransferFee);
    const outputTransferFee = event.outputTransferFee.toNumber();
    console.log("🚀 ~ handleSwapEvent ~ outputTransferFee:", outputTransferFee);
    const baseInput = event.baseInput;
    console.log("🚀 ~ handleSwapEvent ~ baseInput:", baseInput);

    const pool = await PoolModel.findOne({ poolAddress: poolAddress });

    const newTx = {
      holder: user,
      amount: outputAmount,
      direction: baseInput,
      tx: "tx"
    };

    console.log("Tx", newTx);

    PoolStatus.findOne({ poolId: pool?._id }).then((poolStatus) => {
      if (!poolStatus) throw new Error("Pool status not found");
      poolStatus.record.push({
        holder: newTx.holder,
        swapAmount: outVaultBefore - newTx.amount,
        swapDirection: newTx.direction,
        tx: newTx.tx
      });

      return poolStatus.save();
    });
  } catch (error) {
    console.log("Swap error: ", error);
  }
};

const handleLpChangeEvent = async (event: any) => {
  console.log("LpChangeEvent: ", event);
  try {
    const poolAddress = event.poolId.toString();
    console.log("🚀 ~ handleLpChangeEvent ~ poolAddress:", poolAddress);
    const owner = event.owner.toString();
    console.log("🚀 ~ handleLpChangeEvent ~ owner:", owner);
    const lpAmountIn = event.lpAmountIn.toNumber() / Math.pow(10, lpDecimal);
    console.log("🚀 ~ handleLpChangeEvent ~ lpAmountIn:", lpAmountIn);
    const lpSupply = event.lpAmountBefore.toNumber() / Math.pow(10, lpDecimal);
    console.log("🚀 ~ handleLpChangeEvent ~ lpSupply:", lpSupply);
    const token0VaultBefore =
      event.token0VaultBefore.toNumber() / Math.pow(10, lpDecimal);
    console.log(
      "🚀 ~ handleLpChangeEvent ~ token0VaultBefore:",
      token0VaultBefore
    );
    const token1VaultBefore =
      event.token1VaultBefore.toNumber() / Math.pow(10, lpDecimal);
    console.log(
      "🚀 ~ handleLpChangeEvent ~ token1VaultBefore:",
      token1VaultBefore
    );
    const token0TransferFee =
      event.token0TransferFee.toNumber() / Math.pow(10, lpDecimal);
    console.log(
      "🚀 ~ handleLpChangeEvent ~ token0TransferFee:",
      token0TransferFee
    );
    const token1TransferFee =
      event.token1TransferFee.toNumber() / Math.pow(10, lpDecimal);
    console.log(
      "🚀 ~ handleLpChangeEvent ~ token1TransferFee:",
      token1TransferFee
    );
    const type = event.changeType; // 0: deposit, 1: withdraw

    const pool = await PoolModel.findOne({ poolAddress: poolAddress });

    const newTx = {
      holder: owner,
      amount: lpAmountIn,
      direction: type,
      tx: "tx"
    };

    console.log("Tx", newTx);

    LiquidityStatus.findOne({ poolId: pool?._id }).then((Liquiditystatus) => {
      if (!Liquiditystatus) throw new Error("Liqidity status not found");
      Liquiditystatus.record.push({
        holder: newTx.holder,
        swapAmount: newTx.amount,
        swapDirection: newTx.direction,
        tx: newTx.tx
      });

      return Liquiditystatus.save();
    });
  } catch (error) {
    console.log("Lp change error: ", error);
  }
};

let eventListenerConnected: boolean = false;

export const listenerForEvents = async () => {
  console.log("Listening for events...");

  if (eventListenerConnected == true) return;
  eventListenerConnected = true;
  // Add listeners for each event
  const createPoolId = program.addEventListener(
    "createPoolEvent",
    handleCreatePoolEvent
  );
  const swapId = program.addEventListener("swapEvent", handleSwapEvent);
  const lpChangeId = program.addEventListener(
    "lpChangeEvent",
    handleLpChangeEvent
  );

  console.log("Listeners added with IDs:", {
    createPool: createPoolId,
    swap: swapId,
    lpChange: lpChangeId
  });
};

// Call the listener function to start listening for events
listenerForEvents().catch((err) => {
  console.error("Error setting up listener:", err);
});
