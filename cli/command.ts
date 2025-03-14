import { program } from "commander";
import { PublicKey } from "@solana/web3.js";
import {
  configProject,
  setClusterConfig,
} from "./scripts";

program.version("0.0.1");

programCommand("amm-config").action(async (directory, cmd) => {
  const { env, keypair, rpc } = cmd.opts();

  console.log("Solana Cluster:", env);
  console.log("Keypair Path:", keypair);
  console.log("RPC URL:", rpc);

  await setClusterConfig(env, keypair, rpc);

  await configProject();
});

programCommand("swap")
  .option("-t, --token <string>", "token address")
  .option("-a, --amount <number>", "swap amount")
  .option("-s, --style <string>", "0: buy token, 1: sell token")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc, token, amount, style } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);

    await setClusterConfig(env, keypair, rpc);

    if (token === undefined) {
      console.log("Error token address");
      return;
    }

    if (amount === undefined) {
      console.log("Error swap amount");
      return;
    }

    if (style === undefined) {
      console.log("Error swap style");
      return;
    }

    // await swap(new PublicKey(token), amount, style);
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
      "https://devnet.helius-rpc.com/?api-key=7387c4ee-fe6a-43a6-96ea-05e6534aa500 "
    )
    .option(
      "-k, --keypair <string>",
      "Solana wallet Keypair Path",
      "../key/uu.json"
    );
}

program.parse(process.argv);

/*

yarn script amm-config
yarn script launch
yarn script swap -t 22fBUWsqxkrKfypmJPUHhFmxuvXgaxVDAYDov37JPPvU -a 2000000000 -s 0

*/