/**
 * @poh-kit/verifier
 *
 * Server-side Groth16 verification helpers — usable both from Node.js
 * (Cloud Functions, Cloud Run) and as a reference for on-chain Solidity verifiers.
 *
 * This is a skeleton — no implementation yet.
 */

export interface VerifyProofInput {
  proof: unknown;
  publicSignals: unknown[];
  verificationKey: unknown;
}

export async function verifyProof(_input: VerifyProofInput): Promise<boolean> {
  throw new Error("not yet implemented — see roadmap in README.md");
}

export interface NullifierRegistry {
  isUsed(nullifier: string): Promise<boolean>;
  markUsed(nullifier: string): Promise<void>;
}
