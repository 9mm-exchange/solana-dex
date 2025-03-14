import { program } from "commander";
import { PublicKey } from "@solana/web3.js";
import {
  configProject,
  initializeProject,
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

programCommand("initialize")
  .action(async (directory, cmd) => {
    const { env, keypair, rpc } = cmd.opts();

    console.log("Solana Cluster:", env);
    console.log("Keypair Path:", keypair);
    console.log("RPC URL:", rpc);

    await setClusterConfig(env, keypair, rpc);

    await initializeProject();
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
    );
}

program.parse(process.argv);

/*

yarn script amm-config
yarn script initialize

*/