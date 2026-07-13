import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const { EVM_RPC_URL, EVM_DEPLOYER_KEY, ETHERSCAN_API_KEY } = process.env;

// Solidity settings MUST stay 0.8.24 / optimizer runs 200 — these are the
// exact settings the deployed contracts were compiled with, so a redeploy
// from this source reproduces byte-identical runtime bytecode. See VERIFY.md.
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    optimismSepolia: {
      url: EVM_RPC_URL ?? "https://sepolia.optimism.io",
      accounts: EVM_DEPLOYER_KEY ? [EVM_DEPLOYER_KEY] : [],
      chainId: 11155420,
    },
  },
  // `npx hardhat verify` reads the key from ETHERSCAN_API_KEY (a single
  // Etherscan V2 key covers Optimism Sepolia). The key is never committed —
  // export it in your shell. See VERIFY.md for the full recipe.
  etherscan: {
    apiKey: ETHERSCAN_API_KEY ?? "",
  },
  // Sourcify is key-free — an alternative that needs no Etherscan account.
  sourcify: {
    enabled: true,
  },
};

export default config;
