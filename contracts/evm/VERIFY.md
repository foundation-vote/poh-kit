# Source-verifying the identity contracts

The three identity contracts are deployed on **Optimism Sepolia** (chainId
`11155420`) — addresses in [`deployments/optimismSepolia.json`](./deployments/optimismSepolia.json).
This doc gets their **source** verified on a block explorer so anyone can read
the exact code behind the addresses.

## What's true today (measured, not assumed)

The contracts are on-chain but **not source-verified** on the public explorers
(Optimistic Etherscan / Blockscout both report the addresses as unverified
contracts).

The runtime bytecode compiled from **this repo's source** is **byte-identical**
to what's deployed — they diverge only in the trailing Solidity *metadata hash*.
That difference exists because poh-kit changed two things versus the source the
contracts were originally deployed from: the SPDX header
(`MIT` → `MIT OR Apache-2.0`) and a trim of unused errors in `Errors.sol`.
Comments and SPDX lines don't change opcodes, but they do change the metadata
IPFS hash the compiler appends — so:

- Verifying the **existing** addresses from this repo's source → **partial match**
  (runtime bytecode matches; metadata differs). Explorers show it as verified
  with a "partial/similar match" label.
- A **full match** needs the metadata to match too — achieved by either
  redeploying from this repo's source, or verifying from the original
  deploy-time source.

## Recommended: redeploy from poh-kit source → full match (cleanest story)

Makes the on-chain addresses run *exactly* this public source, full-match
verified. Best for grant/audit reviewers ("these addresses = this repo").

```bash
export EVM_DEPLOYER_KEY=0x<funded-optimism-sepolia-deployer-key>   # never commit
export ETHERSCAN_API_KEY=<your-etherscan-v2-api-key>              # never commit
npx hardhat run scripts/deploy.ts --network optimismSepolia
```

The script prints the new addresses and a ready-to-run `hardhat verify` line for
each (each constructor takes the admin address as its single argument). Then
update `deployments/optimismSepolia.json` with the new addresses.

## Status: ✅ verified on Sourcify + Optimistic Etherscan (2026-07-14)

All three addresses are source-verified on **both** explorers:
- **Sourcify** — from this repo's source (`match`: runtime + creation bytecode match;
  metadata differs). Browse `https://repo.sourcify.dev/11155420/<address>`; also on Blockscout.
- **Optimistic Etherscan** — a full byte-for-byte match, verified against the original
  deploy-time source (the same contracts pre-SPDX/`Errors.sol` edits; functionally
  identical). `https://sepolia-optimism.etherscan.io/address/<address>#code`.

Both are accurate — they just reflect different verification models (Sourcify tolerates
the metadata delta; Etherscan needs an exact match, satisfied by the deploy-time source).

## Re-verify on Sourcify (key-free, no gas)

> ⚠ `npx hardhat verify` does **not** work here: Sourcify retired its v1 API
> (2026-07-07) and hardhat-verify 2.x (Hardhat 2) only speaks v1 — the v2 fix is
> Hardhat-3 only. Use the Sourcify **v2 API** directly instead:

```bash
cd contracts/evm && npm install   # first time only
npx hardhat compile
node scripts/verify-sourcify.mjs   # submits all three via the Sourcify v2 API
```

The script reads the standard-JSON input + compiler version from Hardhat's
build-info and posts to `https://sourcify.dev/server/v2/verify/...`. No key, no
constructor args needed (Sourcify derives them). Or verify manually in the UI at
https://verify.sourcify.dev (chain 11155420 + address + the standard-JSON input).

## Notes

- **Never commit `EVM_DEPLOYER_KEY` or `ETHERSCAN_API_KEY`** — export them in your
  shell only. `.env` is gitignored.
- Compiler settings are pinned in `hardhat.config.ts` (0.8.24, optimizer runs
  200) to match the deployed bytecode — don't change them before verifying.
- An Etherscan V2 API key is a single key that covers Optimism Sepolia; get one
  at etherscan.io/apis.
