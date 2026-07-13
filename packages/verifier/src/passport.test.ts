// SPDX-License-Identifier: MIT OR Apache-2.0
import { describe, expect, it } from "vitest";
import { verifyPassportProof, type SelfVerifierLike } from "./passport.js";
import { InMemoryNullifierStore } from "./memory.js";

function fakeVerifier(overrides: Partial<Parameters<SelfVerifierLike["verify"]>> & {
  isValid?: boolean; nullifier?: string; subject?: string; minimumAge?: number; nationality?: string;
} = {}): SelfVerifierLike {
  return {
    async verify() {
      return {
        isValidDetails: { isValid: overrides.isValid ?? true },
        discloseOutput: {
          nullifier: overrides.nullifier ?? "null-1",
          ...(overrides.minimumAge !== undefined && { minimumAge: overrides.minimumAge }),
          ...(overrides.nationality !== undefined && { nationality: overrides.nationality }),
        },
        userData: { userDefinedData: overrides.subject ?? "user-1", userIdentifier: "uuid-1" },
      };
    },
  };
}

const input = { attestationId: 1, proof: {}, pubSignals: {}, userContextData: "ctx" };

describe("verifyPassportProof", () => {
  it("verifies a passport proof: high tier, humanity disclosure, record persisted", async () => {
    const nullifiers = new InMemoryNullifierStore();
    const res = await verifyPassportProof(input, { verifier: fakeVerifier({ minimumAge: 18, nationality: "PT" }), nullifiers });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.status).toBe("verified");
    expect(res.record.trustTier).toBe("high");
    expect(res.record.proofType).toBe("self-passport");
    expect(res.record.disclosures).toEqual([
      { kind: "humanity" },
      { kind: "age", value: "18+" },
      { kind: "jurisdiction", value: "PT" },
    ]);
    expect(await nullifiers.get("null-1")).not.toBeNull();
  });

  it("id-card attestation (2) maps to medium tier", async () => {
    const res = await verifyPassportProof({ ...input, attestationId: 2 }, { verifier: fakeVerifier(), nullifiers: new InMemoryNullifierStore() });
    expect(res.ok && res.record.trustTier).toBe("medium");
  });

  it("rejects unsupported attestation ids without calling the verifier", async () => {
    const res = await verifyPassportProof({ ...input, attestationId: 3 }, { verifier: fakeVerifier(), nullifiers: new InMemoryNullifierStore() });
    expect(res).toMatchObject({ ok: false, code: "UNSUPPORTED_ATTESTATION" });
  });

  it("rejects invalid proofs", async () => {
    const res = await verifyPassportProof(input, { verifier: fakeVerifier({ isValid: false }), nullifiers: new InMemoryNullifierStore() });
    expect(res).toMatchObject({ ok: false, code: "PROOF_REJECTED" });
  });

  it("same subject re-verifying is idempotent; different subject is rejected", async () => {
    const nullifiers = new InMemoryNullifierStore();
    await verifyPassportProof(input, { verifier: fakeVerifier(), nullifiers });
    const again = await verifyPassportProof(input, { verifier: fakeVerifier(), nullifiers });
    expect(again.ok && again.status).toBe("already_verified");
    const other = await verifyPassportProof(input, { verifier: fakeVerifier({ subject: "user-2" }), nullifiers });
    expect(other).toMatchObject({ ok: false, code: "NULLIFIER_ALREADY_USED" });
  });

  it("rejects when both userDefinedData and userIdentifier are empty", async () => {
    const v: SelfVerifierLike = {
      async verify() {
        return {
          isValidDetails: { isValid: true },
          discloseOutput: { nullifier: "n" },
          userData: { userDefinedData: "", userIdentifier: "" },
        };
      },
    };
    const res = await verifyPassportProof(input, { verifier: v, nullifiers: new InMemoryNullifierStore() });
    expect(res).toMatchObject({ ok: false, code: "MISSING_SUBJECT" });
  });
});
