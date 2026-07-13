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
