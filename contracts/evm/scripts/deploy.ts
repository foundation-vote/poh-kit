// SPDX-License-Identifier: MIT OR Apache-2.0
//
// Deploy the three poh-kit identity contracts and print the addresses +
// the exact `hardhat verify` commands to source-verify them.
//
// Usage (Optimism Sepolia):
//   export EVM_DEPLOYER_KEY=0x<funded-deployer-private-key>   # never commit this
//   export EVM_RPC_URL=https://sepolia.optimism.io            # or your RPC
//   npx hardhat run scripts/deploy.ts --network optimismSepolia
//
// The admin address (DEFAULT_ADMIN_ROLE holder) defaults to the deployer.
// Override with ADMIN_ADDRESS. Grant RELAYER_ROLE separately once deployed.
import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const admin = process.env.ADMIN_ADDRESS ?? (await deployer.getAddress());
  console.log(`network: ${network.name}`);
  console.log(`deployer: ${await deployer.getAddress()}`);
  console.log(`admin (constructor arg): ${admin}\n`);

  const registry = await (await ethers.getContractFactory("IdentityRegistry")).deploy(admin);
  await registry.waitForDeployment();
  const commitments = await (await ethers.getContractFactory("IdentityCommitments")).deploy(admin);
  await commitments.waitForDeployment();
  const attestations = await (await ethers.getContractFactory("Attestations")).deploy(admin);
  await attestations.waitForDeployment();

  const addrs = {
    identityRegistry: await registry.getAddress(),
    identityCommitments: await commitments.getAddress(),
    attestations: await attestations.getAddress(),
  };
  console.log("deployed:");
  for (const [name, addr] of Object.entries(addrs)) console.log(`  ${name}: ${addr}`);

  console.log("\nverify (each takes the admin address as its one constructor arg):");
  for (const addr of Object.values(addrs)) {
    console.log(`  npx hardhat verify --network ${network.name} ${addr} ${admin}`);
  }
  console.log(
    "\nUpdate deployments/optimismSepolia.json with these addresses and the admin/relayer,",
  );
  console.log("then re-run the verify commands above (or `--network optimismSepolia` + Sourcify).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
