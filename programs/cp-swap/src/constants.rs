use anchor_lang::prelude::*;  

// Config
pub const AMM_CONFIG_SEED: &str = "amm_config";

// Auth
pub const AUTH_SEED: &str = "vault_and_lp_mint_auth_seed";

/// Seed to derive account address and signature
pub const OBSERVATION_SEED: &str = "observation";

// Number of ObservationState elements
pub const OBSERVATION_NUM: usize = 100;
pub const OBSERVATION_UPDATE_DURATION_DEFAULT: u64 = 15;

/// Seed to derive account address and signature
pub const POOL_SEED: &str = "pool";
pub const POOL_LP_MINT_SEED: &str = "pool_lp_mint";
pub const POOL_VAULT_SEED: &str = "pool_vault";

// Admin
pub const ADMIN: Pubkey = anchor_lang::solana_program::pubkey!("H7YMxhKgLw2NDM9WQnpcUefPvCaLJCCYYaq1ETLHXJuH");
