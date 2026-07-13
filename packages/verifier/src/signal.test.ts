// SPDX-License-Identifier: MIT OR Apache-2.0
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@semaphore-protocol/proof", () => ({ verifyProof: vi.fn() }));
import { verifyProof } from "@semaphore-protocol/proof";
import { verifySemaphoreSignal } from "./signal.js";
import { InMemoryGroupStore, InMemoryNullifierStore, InMemoryUsedSignalStore } from "./memory.js";
import { buildGroups } from "./groups.js";
import { createIdentity } from "@poh-kit/core";

const mockVerify = vi.mocked(verifyProof);

function proofWithRoot(root: string, nullifier = "42") {
  // Shape mirrors @semaphore-protocol/proof v4 SemaphoreProof.
  return {
    merkleTreeDepth: 1, merkleTreeRoot: root, message: "1",
    nullifier, scope: "prop-1", points: [] as string[],
  } as never;
}

describe("verifySemaphoreSignal", () => {
  let groups: InMemoryGroupStore;
  let used: InMemoryUsedSignalStore;
  let root: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    groups = new InMemoryGroupStore();
    used = new InMemoryUsedSignalStore();
    const nullifiers = new InMemoryNullifierStore();
    await nullifiers.put({
      nullifier: "n1", commitment: createIdentity("m").commitment,
      proofType: "self-passport", attestationId: 1,
      verifiedAt: new Date(0).toISOString(),
      disclosures: [{ kind: "humanity" }], subject: "u1", trustTier: "high",
    });
    root = (await buildGroups(nullifiers, groups)).medium.root;
  });

  it("verifies a valid signal and marks the nullifier used", async () => {
    mockVerify.mockResolvedValue(true);
    const res = await verifySemaphoreSignal(
      { proof: proofWithRoot(root), minTier: "medium", scope: "prop-1" },
      { groups, usedSignals: used },
    );
    expect(res).toEqual({ ok: true, nullifier: "42" });
    expect(await used.has("prop-1", "42")).toBe(true);
  });

  it("rejects a root that does not match the tier group", async () => {
    mockVerify.mockResolvedValue(true);
    const res = await verifySemaphoreSignal(
      { proof: proofWithRoot("999"), minTier: "medium", scope: "prop-1" },
      { groups, usedSignals: used },
    );
    expect(res).toMatchObject({ ok: false, code: "TIER_ROOT_MISMATCH" });
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("rejects a replayed nullifier", async () => {
    mockVerify.mockResolvedValue(true);
    await used.markUsed("prop-1", "42");
    const res = await verifySemaphoreSignal(
      { proof: proofWithRoot(root), minTier: "medium", scope: "prop-1" },
      { groups, usedSignals: used },
    );
    expect(res).toMatchObject({ ok: false, code: "ALREADY_SIGNALED" });
  });

  it("rejects an empty tier group", async () => {
    const emptyGroups = new InMemoryGroupStore();
    const res = await verifySemaphoreSignal(
      { proof: proofWithRoot(root), minTier: "medium", scope: "prop-1" },
      { groups: emptyGroups, usedSignals: used },
    );
    expect(res).toMatchObject({ ok: false, code: "GROUP_EMPTY" });
  });

  it("rejects an invalid proof and does not mark the nullifier", async () => {
    mockVerify.mockResolvedValue(false);
    const res = await verifySemaphoreSignal(
      { proof: proofWithRoot(root), minTier: "medium", scope: "prop-1" },
      { groups, usedSignals: used },
    );
    expect(res).toMatchObject({ ok: false, code: "INVALID_PROOF" });
    expect(await used.has("prop-1", "42")).toBe(false);
  });
});
