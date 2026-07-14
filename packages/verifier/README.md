# @poh-kit/verifier

Server-side verification for [poh-kit](https://github.com/poh-kit/poh-kit):
Self Protocol ePassport proofs + tier-gated anonymous Semaphore signals, written
against pluggable storage so you bring your own persistence.

## Install

```bash
npm install @poh-kit/verifier @poh-kit/core
```

## What's here

- **`verifyPassportProof(input, deps)`** + **`createSelfVerifier(config)`** — verify a
  Self Protocol proof, enforce one-passport-one-nullifier (Sybil resistance), and
  record an `IdentityProofRecord`. Same subject re-verifying is idempotent.
- **`verifySemaphoreSignal(input, deps)`** — verify a tier-gated, replay-protected
  anonymous signal. Checks run group-nonempty → tier-root match → nullifier-unspent
  → ZK proof, marking the nullifier spent only on full success.
- **`buildGroups(nullifiers, groups)`** — build the tier-expanded Semaphore groups
  from verified commitments.
- **Storage adapters** — `NullifierStore`, `GroupStore`, `UsedSignalStore` interfaces
  (the open/closed boundary), plus `InMemory*` implementations for tests and examples.

The in-memory stores are for development. In production, implement the three
interfaces against your own datastore.

## Example

See the runnable end-to-end flow (real Groth16 proof) in
[`examples/evm-hardhat`](https://github.com/poh-kit/poh-kit/tree/main/examples/evm-hardhat).

## License

MIT OR Apache-2.0.
