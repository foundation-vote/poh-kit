// SPDX-License-Identifier: MIT OR Apache-2.0
import { Identity } from "@semaphore-protocol/identity";

export interface PohIdentity {
  identity: Identity;
  /** Decimal-string Semaphore commitment — the value anchored on-chain and
   *  attached to a verified nullifier. */
  commitment: string;
}

/**
 * Create a Semaphore identity. With `secret`, derivation is deterministic —
 * the caller owns secret custody (e.g. derive from a passkey). Without it,
 * a random identity is generated.
 */
export function createIdentity(secret?: string): PohIdentity {
  const identity = secret === undefined ? new Identity() : new Identity(secret);
  return { identity, commitment: identity.commitment.toString() };
}
