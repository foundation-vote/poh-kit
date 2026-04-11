/**
 * @poh-kit/core
 *
 * Core identity commitment, nullifier management, and proof lifecycle.
 *
 * This is a skeleton — no implementation yet. See the project README and
 * the grant application at ../../ethereum-foundation-pse-application.md
 * for the roadmap.
 */

export interface IdentityProof {
  /** Unique identifier derived from the passport, prevents double-enrollment */
  nullifier: string;
  /** Semaphore identity commitment (Poseidon hash) */
  commitment: string;
  /** Which proof system produced this — "self-passport" | "manual-review" */
  proofType: "self-passport" | "manual-review";
  /** ISO-8601 timestamp of verification */
  verifiedAt: string;
  /** Selective disclosures the user chose to reveal */
  disclosures: Disclosure[];
}

export interface Disclosure {
  kind: "humanity" | "age" | "jurisdiction";
  value?: unknown;
}

export interface VerifyPassportInput {
  selfProof: unknown; // Self Protocol proof — type to be imported from @selfxyz/core
  disclosures: Array<Disclosure["kind"] | string>;
}

export async function verifyPassport(
  _input: VerifyPassportInput,
): Promise<Pick<IdentityProof, "nullifier" | "commitment">> {
  throw new Error("not yet implemented — see roadmap in README.md");
}

export interface CreateIdentityInput {
  /** Seed bytes, typically derived from a WebAuthn-protected secret */
  seed: Uint8Array;
}

export async function createIdentity(_input: CreateIdentityInput): Promise<unknown> {
  throw new Error("not yet implemented — see roadmap in README.md");
}

export interface CastSignalInput {
  identity: unknown;
  group: unknown;
  signal: string;
  externalNullifier: string;
}

export async function castAnonymousSignal(_input: CastSignalInput): Promise<unknown> {
  throw new Error("not yet implemented — see roadmap in README.md");
}
