export const SOLANA_RPC = import.meta.env.VITE_SOLANA_RPC ?? "";

export const TokenList = [
  { id: "USDe", text: "USDe", address: "DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT", img: "https://swap.pump.fun/tokens/usde.webp" },
  { id: "TRX", text: "Tron", address: "GbbesPbaYh5uiAZSYNXTc7w9jty1rpg3P9L4JeN4LkKc", img: "https://swap.pump.fun/tokens/trx.webp" },
  { id: "APT", text: "Aptos", address: "DTDQEQWgBmnnJ7YGVoQrXkkroTEUkYgAfhEVb8CrnkpC", img: "https://swap.pump.fun/tokens/aptos.webp" },
  { id: "PENGU", text: "Pudgy Penguins", address: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", img: "https://swap.pump.fun/tokens/pengu.webp" },
  { id: "WLD", text: "Worldcoin (Wormhole)", address: "DN4L5JE9VuGpMt1SsEWqyybUqyrYuWuywmTq7Q5GVDFK", img: "https://swap.pump.fun/tokens/wld.webp" },
  { id: "DRIFT", text: "Drift", address: "DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7", img: "https://swap.pump.fun/tokens/drift.webp" },
]

export const TestPoolList = [
  { vol: "192.04K", liquidity: "1.39M", address: "DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT", lpMint: "" },
  { vol: "92.04K", liquidity: "9M", address: "DN4L5JE9VuGpMt1SsEWqyybUqyrYuWuywmTq7Q5GVDFK", lpMint: "" },
  { vol: "54.04K", liquidity: "3M", address: "DTDQEQWgBmnnJ7YGVoQrXkkroTEUkYgAfhEVb8CrnkpC", lpMint: "" },
  { vol: "62.04K", liquidity: "1M", address: "DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT", lpMint: "" },
  { vol: "58.04K", liquidity: "57K", address: "2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv", lpMint: "" },
  { vol: "24.04K", liquidity: "255K", address: "DTDQEQWgBmnnJ7YGVoQrXkkroTEUkYgAfhEVb8CrnkpC", lpMint: "" },
  { vol: "32.04K", liquidity: "2.1M", address: "GbbesPbaYh5uiAZSYNXTc7w9jty1rpg3P9L4JeN4LkKc", lpMint: "" },
  { vol: "621.04K", liquidity: "39M", address: "DriFtupJYLTosbwoN8koMbEYSx54aFAVLddWsbksjwg7", lpMint: "" },
]
