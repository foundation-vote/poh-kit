import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const { EVM_RPC_URL, EVM_DEPLOYER_KEY } = process.env;

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
};

export default config;
