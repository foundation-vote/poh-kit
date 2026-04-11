# poh-kit Architecture

## Design goals

1. **Composable** — combine Self Protocol (enrollment) and Semaphore (signaling) cleanly without leaking information across layers
2. **Chain-agnostic** — the core library has no chain dependency; verifier helpers work both on-chain (Solidity) and off-chain (Node.js)
3. **Privacy by construction** — no PII ever leaves the device; nullifier unlinkability preserved across proposals
4. **Developer-first** — tutorial-driven docs, typed React hooks, a runnable EVM example reviewers can `npm create poh-kit` their way into

## Layered model

poh-kit separates the identity lifecycle into three distinct layers:

### Layer 1 — Enrollment (Self Protocol)

**Goal:** prove that the user is a real, unique human.

- User reads an ICAO ePassport via the Self mobile app's NFC flow
- Self's Circom circuit verifies the passport chip's Country Signing Certificate Authority (CSCA) signature inside a ZK-SNARK
- Output: a **nullifier** (unique per passport) and a set of **selective disclosures** (humanity, age bucket, jurisdiction)
- The nullifier is the Sybil-resistance primitive — one passport, one identity, forever

### Layer 2 — Identity Binding (Semaphore)

**Goal:** bind the proven humanity to a long-lived, privacy-preserving identity.

- The user's Semaphore identity `{ trapdoor, nullifier }` is derived deterministically from a WebAuthn-protected secret stored in the device's secure enclave
- On successful Layer 1 verification, the Semaphore identity commitment `Poseidon(trapdoor, nullifier)` is posted to a Merkle group, linked only via the passport nullifier
- The Semaphore identity **never leaves the device** — only the commitment is public

### Layer 3 — Anonymous Signaling

**Goal:** cast votes/signals that are unlinkable both to the passport and across proposals.

- For each proposal, the user generates a Semaphore group-membership proof with an `externalNullifier` set to the proposal ID
- The proof reveals nothing except "I am in the group" and "I have not voted in this proposal before"
- Two votes by the same user across two proposals are **cryptographically unlinkable**, even with full database access

## Data model

```ts
interface IdentityProof {
  nullifier: string;        // from Layer 1 (passport-unique)
  commitment: string;       // from Layer 2 (Semaphore identity)
  proofType: "self-passport" | "manual-review";
  verifiedAt: string;       // ISO-8601
  disclosures: Disclosure[];
}

interface Disclosure {
  kind: "humanity" | "age" | "jurisdiction";
  value?: unknown;
}
```

## Fallback path (out of `poh-kit` scope, referenced for completeness)

Not every user has an ePassport. Foundation's full Pillar 1 architecture includes a **manual-review fallback** using InsightFace + Silent-Face-Anti-Spoofing for liveness, gated by a human reviewer. This fallback is **out of scope for poh-kit** and the EF grant — it is Foundation-specific infrastructure because (a) it's not a ZK primitive, (b) it has BIPA/GDPR implications that must be handled per-deployment, and (c) it doesn't benefit the Ethereum ecosystem in the same way the chain-agnostic poh-kit does.

## What poh-kit does NOT include

- **Key management** — KMS, HSM, key rotation — deployment-specific
- **Blockchain indexing** — use Graph Protocol, Covalent, or Solana's getProgramAccounts directly
- **Governance semantics** — quorum, delegation, proposal types — that's application-level
- **The fallback biometric path** — see note above
- **Solana integration** — the grant funds EVM-first work; Solana support is Foundation's own concern

## Open questions for reviewers

1. Should `@poh-kit/core` include a pluggable nullifier-registry interface, or assume users bring their own?
2. Should the `@poh-kit/react` hooks be decoupled from any UI framework, or specifically target the most common ZK dapp stack (wagmi + viem)?
3. Is dual-licensing MIT/Apache 2.0 the right default, or should we follow PSE's convention of MIT-only?

Feedback welcome on the grant application and on the ethresear.ch pre-announcement thread (link TBD).
