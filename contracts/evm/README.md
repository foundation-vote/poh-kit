# @poh-kit/contracts-evm

The three identity contracts of the PoH primitive, deployed on Optimism Sepolia
(chainId 11155420 — addresses in [deployments/optimismSepolia.json](./deployments/optimismSepolia.json)):

| Contract | Purpose |
|---|---|
| `IdentityRegistry` | Population codes (UN-M49) + H3 cells per opaque uid key |
| `IdentityCommitments` | One-time Semaphore commitment anchor per uid |
| `Attestations` | Soulbound attestation records (0=VERIFIED_HUMAN, 1=VOTED, 2=SUPPORTED_PROPOSAL, 3=RECEIVED_SHARE) |

Writes are relayer-gated (`RELAYER_ROLE`); reads are public. Ordinals match the
Solana programs in [`../solana`](../solana).

```bash
npm install && npx hardhat test
```

## Source verification

The deployed addresses are not yet source-verified on the public explorers.
See [VERIFY.md](./VERIFY.md) for the recipe — including the measured fact that
this repo's source compiles to byte-identical runtime bytecode, and why a full
match needs either a redeploy from this source or verification from the original
deploy-time source.
