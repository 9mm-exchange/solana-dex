# 9mm-soldex(raydium-cp-swap fork) program

## Prerequites

Install Rust, Solana, and Anchor

Here's a useful link. https://anchor-lang.com/docs/installation

```bash
# check rust version
rustc --version

# check solana version
solana --version

# check anchor version
# should be 0.30.1
anchor --version

# check solana configuration
solana config get

# set solana rpc as devnet
solana config set --url devnet

# check wallet set in the config
solana balance

# generate new wallet if doesn't exist
solana-keygen new

# airdrop some devnet SOL
solana airdrop 5
```

Prepare the project
```bash
# clone the git repo
git clone https://github.com/...

# install node modules
yarn
```

## Quick Start

### Build the program

```bash
# build the program
# it will generate new keypair for the program if doesn't exist
# and it will make a build version
anchor build

# sync all keys in program
anchor keys sync

# build again if the program address in lib.rs is changed
anchor build

# you can get keypair and so file here
# ./target/deploy/raydium_cp_swap-keypair.json
# ./target/deploy/raydium_cp_swap.so
```

### Run tests on localnet

Set the cluster as localnet in `Anchor.toml`:
```bash
[provider]
cluster = "Localnet"
```

you can run the tests without having to start a local network:

```bash
anchor test --provider.cluster Localnet
```

### Test program on devnet

Set the cluster as devnet in `Anchor.toml`:
```bash
[provider]
cluster = "<DEVNET_RPC>"
```

Deploy program:
```bash
anchor deploy
```

#### Use CLI to test the program

Initialize program:
```bash
yarn script amm-config
```

Launch a create pool:
```bash
yarn script create-pool
```

Swap token:
```bash
yarn script swap -t <TOKEN0_MINT> -a <SWAP_AMOUNT> -T <TOKEN1_MINT> -d <SWAP_DIRECTION>
# <TOKEN0_MINT>: token0 mint
# <TOKEN1_MINT>: token1 mint
# <SWAP_AMOUNT>: TOKEN0/TOKEN1 amount to swap
# <SWAP_DIRECTION>: 0 - Buy token, 1 - Sell token
```

Deposit liquidity:
```bash
yarn script deposit -t <TOKEN0_MINT> -T <TOKEN1_MINT> -a <TOKEN0_AMOUNT> -A <TOKEN1_AMOUNT> -l <LP_TOKEN_AMOUNT>
# <TOKEN0_MINT>: mint address of token0
# <TOKEN1_MINT>: mint address of token1
# <TOKEN0_AMOUNT>: amount of token0 to deposit (in smallest units, e.g., lamports)
# <TOKEN1_AMOUNT>: amount of token1 to deposit (in smallest units)
# <LP_TOKEN_AMOUNT>: amount of LP tokens to mint (in smallest units)
```

**Example:**
```bash
yarn script deposit -t 4ge5r4Y1ofDE1N3YacyBD6kC5tNid9bVKMWqEGx2AS1N -T AoxWQgkPtERfTfyksekLHKDmv1cPmVtcsBVgF8311ZSs -a 100000000000 -A 200000000000 -l 10000000000
```

Withdraw liquidity:
```bash
yarn script withdraw -t <TOKEN0_MINT> -T <TOKEN1_MINT> -a <TOKEN0_AMOUNT> -A <TOKEN1_AMOUNT> -l <LP_AMOUNT>
```

**Example:**
```bash
yarn script withdraw -t 4ge5r4Y1ofDE1N3YacyBD6kC5tNid9bVKMWqEGx2AS1N -T AoxWQgkPtERfTfyksekLHKDmv1cPmVtcsBVgF8311ZSs -a 10000000 -A 2000000 -l 10000000
```