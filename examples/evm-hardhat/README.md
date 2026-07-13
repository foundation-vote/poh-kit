# End-to-end EVM example

The full poh-kit loop on a local Hardhat chain: deploy the identity contracts,
create Semaphore identities, anchor commitments, build tier groups, cast an
anonymous tier-gated signal (real Groth16 proof), reject a replay, and issue a
soulbound VERIFIED_HUMAN attestation.

```bash
npm install
npm run e2e   # first run downloads Semaphore snark artifacts (~few MB)
```

Passport verification is mocked here; the production flow
(`@poh-kit/verifier`'s `createSelfVerifier`) verifies Self Protocol proofs
against the Celo hub and needs a real ePassport scan from the Self app.
