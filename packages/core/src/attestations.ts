// SPDX-License-Identifier: MIT OR Apache-2.0
// Ordinals are a cross-chain constant — do not reorder. Values 0-2 match both
// Attestations.sol (../../contracts/evm) and the Solana attestations program
// (MAX_ATTESTATION_TYPE = 2). RECEIVED_SHARE (3) exists on EVM only; the Solana
// program intentionally covers just the three governance kinds and rejects 3.
export enum AttestationKind {
  VERIFIED_HUMAN = 0,
  VOTED = 1,
  SUPPORTED_PROPOSAL = 2,
  RECEIVED_SHARE = 3,
}
