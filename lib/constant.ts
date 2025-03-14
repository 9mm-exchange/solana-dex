import { MAINNET_PROGRAM_ID, DEVNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { Cluster, PublicKey } from "@solana/web3.js";

// config
export const AMM_CONFIG_SEED = "amm_config";

// auth
export const AUTH_SEED = "vault_and_lp_mint_auth_seed";

/// Seed to derive account address and signature
export const OBSERVATION_SEED = "observation";
// Number of ObservationState element
export const OBSERVATION_NUM = 100;
export const OBSERVATION_UPDATE_DURATION_DEFAULT = 15;

/// Seed to derive account address and signature
export const POOL_SEED = "pool";
export const POOL_LP_MINT_SEED = "pool_lp_mint";
export const POOL_VAULT_SEED = "pool_vault";

export const TEST_INDEX = 0;
export const TEST_TRADE_FEE_RATE = 10;
export const TEST_PROTOCOL_FEE_RATE = 1000;
export const TEST_FUND_FEE_RATE = 25000;
export const TEST_CREATE_FEE = 0;
export const TEST_INITIAL_AMOUNT_0 = 1000000000;
export const TEST_INITIAL_AMOUNT_1 = 1000000000;

const cluster: Cluster = "devnet";

export const raydiumProgramId =
  cluster.toString() == "mainnet-beta" ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;

export const marketProgram =
  cluster.toString() == "mainnet-beta"
    ? new PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX") // mainnet-beta
    : new PublicKey("EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj"); // devnet

export const feeDestination =
  cluster.toString() == "mainnet-beta"
    ? new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5") // Mainnet
    : new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR"); // Devnet
