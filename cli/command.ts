import { program } from "commander";
import { PublicKey } from "@solana/web3.js";
import {
  configProject,
  deposite,
  createPool,
  setClusterConfig,
  swap,
  updateConfig,
  withdraw,
  collectFundFee,
} from "./scripts";

program.version("0.0.1");

programCommand("amm-config").action(async (directory, cmd) => {
  const { env, keypair, rpc, creator } = cmd.opts();

  console.log("Solana Cluster:", env);
  console.log("Keypair Path:", keypair);
  console.log("RPC URL:", rpc);
  console.log("Creator Path: ", creator);

  await setClusterConfig(env, keypair, creator, rpc);

  await configProject();
});

programCommand("update-config")
  .option("-p, --param <number>", "parameter")
  .option("-v, --value <number>", "value for update")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, creator, param, value } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);
    console.log("Creator Path: ", creator);
    console.log("param: ", param);
    console.log("value: ", value);

    await setClusterConfig(env, keypair, creator, rpc);

    await updateConfig(param, value);
  })

programCommand("create-pool")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, creator } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);
    console.log("Creator Path: ", creator);

    await setClusterConfig(env, keypair, creator, rpc);

    await createPool();
  });

programCommand("deposit")
  .option("-t, --token0 <string>", "token0 address")
  .option("-T, --token1 <string>", "token1 address")
  .option("-a, --amount0 <number>", "token0 amount")
  .option("-A, --amount1 <number>", "token1 amount")
  .option("-l, --lpAmount <number>", "lp token amount")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, creator, token0, amount0, token1, amount1, lpAmount } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);
    console.log("Creator Path: ", creator);
    console.log("token0: ", token0);
    console.log("token0 amount: ", amount0);
    console.log("token1: ", token1);
    console.log("token1 amount: ", amount1);
    console.log("lp amount: ", lpAmount);

    await setClusterConfig(env, keypair, creator, rpc);

    await deposite(new PublicKey(token0), new PublicKey(token1), lpAmount, amount0, amount1)
  });

programCommand("swap")
  .option("-t, --token0 <string>", "token0 address")
  .option("-T, --token1 <string>", "token1 address")
  .option("-a, --amount <number>", "token0 amount")
  .option("-d, --direction <number>", "buy/sell")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, creator, token0, amount, token1, direction } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);
    console.log("Creator Path: ", creator);
    console.log("token0: ", token0);
    console.log("token0 amount: ", amount);
    console.log("token1: ", token1);
    console.log("direction: ", direction);

    await setClusterConfig(env, keypair, creator, rpc);

    await swap(new PublicKey(token0), new PublicKey(token1), amount, direction);
  });

programCommand("withdraw")
  .option("-t, --token0 <string>", "token0 address")
  .option("-T, --token1 <string>", "token1 address")
  .option("-a, --amount0 <number>", "token0 amount")
  .option("-A, --amount1 <number>", "token1 amount")
  .option("-l, --lpAmount <number>", "lp token amount")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, creator, token0, amount0, token1, amount1, lpAmount } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);
    console.log("Creator Path: ", creator);
    console.log("token0: ", token0);
    console.log("token0 amount: ", amount0);
    console.log("token1: ", token1);
    console.log("token1 amount: ", amount1);
    console.log("lp amount: ", lpAmount);

    await setClusterConfig(env, keypair, creator, rpc);

    await withdraw(new PublicKey(token0), new PublicKey(token1), lpAmount, amount0, amount1)
  });

programCommand("collect-fundfee")
  .option("-t, --token0 <string>", "token0 address")
  .option("-T, --token1 <string>", "token1 address")
  .option("-a, --amount0 <number>", "token0 amount")
  .option("-A, --amount1 <number>", "token1 amount")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, creator, token0, amount0, token1, amount1 } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);
    console.log("Creator Path: ", creator);
    console.log("token0: ", token0);
    console.log("token0 amount: ", amount0);
    console.log("token1: ", token1);
    console.log("token1 amount: ", amount1);

    await setClusterConfig(env, keypair, creator, rpc);

    await collectFundFee(new PublicKey(token0), new PublicKey(token1), amount0, amount1)
  });

function programCommand(name: string) {
  return program
    .command(name)
    .option(
      //  mainnet-beta, testnet, devnet
      "-e, --env <string>",
      "Solana cluster env name",
      "devnet"
    )
    .option(
      "-r, --rpc <string>",
      "Solana cluster RPC name",
      "https://devnet.helius-rpc.com/?api-key=8ea72171-c0a2-43eb-a8a5-b77c98d89343"
    )
    .option(
      "-k, --keypair <string>",
      "Solana wallet Keypair Path",
      "../key/uu.json"
    )
    .option(
      "-c, --creator <string>",
      "Solana wallet Keypair Path",
      "../key/uu.json"
    );
}

program.parse(process.argv);

/*

yarn script amm-config

yarn script create-pool

yarn script deposit -t 4ge5r4Y1ofDE1N3YacyBD6kC5tNid9bVKMWqEGx2AS1N -T AoxWQgkPtERfTfyksekLHKDmv1cPmVtcsBVgF8311ZSs -a 100000000000 -A 200000000000 -l 10000000000

yarn script swap -t 4ge5r4Y1ofDE1N3YacyBD6kC5tNid9bVKMWqEGx2AS1N -a 100000000 -T AoxWQgkPtERfTfyksekLHKDmv1cPmVtcsBVgF8311ZSs -d 0

yarn script swap -t 4ge5r4Y1ofDE1N3YacyBD6kC5tNid9bVKMWqEGx2AS1N -a 100000000 -T AoxWQgkPtERfTfyksekLHKDmv1cPmVtcsBVgF8311ZSs -d 1

yarn script withdraw -t 4ge5r4Y1ofDE1N3YacyBD6kC5tNid9bVKMWqEGx2AS1N -T AoxWQgkPtERfTfyksekLHKDmv1cPmVtcsBVgF8311ZSs -a 10000000 -A 2000000 -l 10000000

yarn script collect-fundfee -t 4ge5r4Y1ofDE1N3YacyBD6kC5tNid9bVKMWqEGx2AS1N -T AoxWQgkPtERfTfyksekLHKDmv1cPmVtcsBVgF8311ZSs -a 10000000 -A 2000000

yarn script update-config -p 0 -v 2500        //trade_fee_rate
yarn script update-config -p 1 -v 120000      //protocol_fee_rate
yarn script update-config -p 2 -v 40000       //fund_fee_rate
yarn script update-config -p 3 -v             //new owner
yarn script update-config -p 4 -v             //new fund owner
*/