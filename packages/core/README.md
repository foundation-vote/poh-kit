# @poh-kit/core

Chain-agnostic types and identity primitives for [poh-kit](https://github.com/poh-kit/poh-kit) —
layered proof-of-humanity combining Self Protocol (ZK ePassport) with Semaphore
(anonymous group signaling).

Zero server dependencies. This is the shared vocabulary the verifier, client,
and contracts all agree on.

## Install

```bash
npm install @poh-kit/core
```

## What's here

- **Trust tiers** — `TrustTier` (`low` / `medium` / `high`), `TIER_RANK`, `TIERS`,
  and `meetsTier(tier, minTier)` (a tier-T member belongs to every group whose
  minimum tier rank ≤ rank(T)).
- **Attestation mapping** — `proofTypeForAttestation(id)` and `trustTierFor(proofType)`
  map Self Protocol attestation IDs to a proof type and trust tier.
- **`AttestationKind`** — the cross-chain ordinal enum
  (`0` VERIFIED_HUMAN … `3` RECEIVED_SHARE) shared by the EVM and Solana contracts.
- **`createIdentity(secret?)`** — a Semaphore identity + its decimal-string
  commitment. Deterministic given a secret (you own secret custody), random otherwise.
- **`IdentityProofRecord` / `DisclosureItem`** — the verified-identity record shape
  (bounded categorical disclosures only — never raw PII).

## Example

```ts
import { createIdentity, trustTierFor, proofTypeForAttestation } from "@poh-kit/core";

const { identity, commitment } = createIdentity("passkey-derived-secret");
const tier = trustTierFor(proofTypeForAttestation(1)!); // "high" (passport)
```

## License

MIT OR Apache-2.0.
