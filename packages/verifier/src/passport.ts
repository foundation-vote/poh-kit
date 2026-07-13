// SPDX-License-Identifier: MIT OR Apache-2.0
import { AllIds, DefaultConfigStore, SelfBackendVerifier, type VerificationConfig } from "@selfxyz/core";
import {
  proofTypeForAttestation, trustTierFor,
  type DisclosureItem, type IdentityProofRecord,
} from "@poh-kit/core";
import { silentLogger, type NullifierStore, type PohLogger } from "./stores.js";

export interface SelfVerifyOutcome {
  isValidDetails: { isValid: boolean } & Record<string, unknown>;
  discloseOutput: { nullifier?: string; minimumAge?: number | string; nationality?: string };
  userData: { userDefinedData?: string; userIdentifier?: string };
}

/** The slice of SelfBackendVerifier the flow needs — injectable for tests. */
export interface SelfVerifierLike {
  verify(attestationId: number, proof: unknown, pubSignals: unknown, userContextData: unknown): Promise<SelfVerifyOutcome>;
}

export interface SelfVerifierConfig {
  /** Must match the frontend SelfApp.scope. */
  scope: string;
  /** Public URL of the endpoint receiving proofs — bound into the proof. */
  endpoint: string;
  /** Accept mock passports from the Self dev environment. NEVER in production. */
  devMode?: boolean;
  minimumAge?: number;
  excludedCountries?: string[];
  ofac?: boolean;
}

/** Construct the real Self verifier. Expensive (reads Celo contracts) — build once and reuse. */
export function createSelfVerifier(config: SelfVerifierConfig): SelfVerifierLike {
  // `excludedCountries` is typed `Country3LetterCode[]` (a literal union of ISO
  // 3-letter codes) in @selfxyz/core's `VerificationConfig`, but that type isn't
  // re-exported from the package's public entrypoint — only `VerificationConfig`
  // itself is. Callers pass plain `string[]`; cast at this single boundary
  // rather than depending on @selfxyz/common (an undeclared transitive dep) to
  // reach the literal type.
  const store = new DefaultConfigStore({
    minimumAge: config.minimumAge ?? 18,
    excludedCountries: (config.excludedCountries ?? []) as VerificationConfig["excludedCountries"],
    ofac: config.ofac ?? false,
  });
  return new SelfBackendVerifier(
    config.scope, config.endpoint, config.devMode ?? false, AllIds, store, "uuid",
  ) as unknown as SelfVerifierLike;
}

export interface VerifyPassportInput {
  attestationId: number;
  proof: unknown;
  pubSignals: unknown;
  userContextData: unknown;
}

export type VerifyPassportResult =
  | { ok: true; status: "verified" | "already_verified"; record: IdentityProofRecord }
  | { ok: false; code: "MISSING_FIELDS" | "UNSUPPORTED_ATTESTATION" | "PROOF_REJECTED" | "MISSING_SUBJECT" | "NULLIFIER_ALREADY_USED"; message: string; details?: unknown };

/**
 * Verify a Self Protocol ePassport/ID proof and persist the identity record.
 * One passport → one nullifier: a spent nullifier under a different subject is
 * rejected (Sybil prevention); the same subject re-verifying is idempotent.
 * Disclosures store bounded categorical values only — never raw PII.
 */
export async function verifyPassportProof(
  input: VerifyPassportInput,
  deps: { verifier: SelfVerifierLike; nullifiers: NullifierStore; logger?: PohLogger },
): Promise<VerifyPassportResult> {
  const log = deps.logger ?? silentLogger;
  if (input.attestationId == null || !input.proof || !input.pubSignals || input.userContextData == null) {
    return { ok: false, code: "MISSING_FIELDS", message: "Missing required fields: attestationId, proof, pubSignals, userContextData" };
  }
  const proofType = proofTypeForAttestation(input.attestationId);
  if (!proofType) {
    return { ok: false, code: "UNSUPPORTED_ATTESTATION", message: `Unsupported attestationId ${input.attestationId}` };
  }

  const result = await deps.verifier.verify(input.attestationId, input.proof, input.pubSignals, input.userContextData);
  if (!result.isValidDetails.isValid) {
    log.warn("passport proof rejected", { attestationId: input.attestationId, details: result.isValidDetails });
    return { ok: false, code: "PROOF_REJECTED", message: "Proof verification failed", details: result.isValidDetails };
  }

  const nullifier = result.discloseOutput.nullifier;
  const subject = result.userData.userDefinedData?.trim() || result.userData.userIdentifier;
  if (!nullifier || !subject) {
    return { ok: false, code: "MISSING_SUBJECT", message: "Proof missing nullifier or subject (userDefinedData and userIdentifier both empty)" };
  }

  const disclosures: DisclosureItem[] = [{ kind: "humanity" }];
  if (result.discloseOutput.minimumAge) {
    disclosures.push({ kind: "age", value: `${result.discloseOutput.minimumAge}+` });
  }
  if (result.discloseOutput.nationality) {
    disclosures.push({ kind: "jurisdiction", value: result.discloseOutput.nationality });
  }

  const existing = await deps.nullifiers.get(nullifier);
  if (existing) {
    if (existing.subject !== subject) {
      return { ok: false, code: "NULLIFIER_ALREADY_USED", message: "Nullifier already bound to another subject" };
    }
    return { ok: true, status: "already_verified", record: existing };
  }

  const record: IdentityProofRecord = {
    nullifier,
    commitment: "",
    proofType,
    attestationId: input.attestationId,
    verifiedAt: new Date().toISOString(),
    disclosures,
    subject,
    trustTier: trustTierFor(proofType),
  };
  await deps.nullifiers.put(record);
  return { ok: true, status: "verified", record };
}
