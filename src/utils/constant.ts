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

export const lpDecimal = 9;

const cluster: Cluster = "devnet";
