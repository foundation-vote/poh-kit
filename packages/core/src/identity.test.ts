// SPDX-License-Identifier: MIT OR Apache-2.0
import { describe, expect, it } from "vitest";
import { createIdentity } from "./identity.js";

describe("createIdentity", () => {
  it("returns a Semaphore identity with a decimal-string commitment", () => {
    const { identity, commitment } = createIdentity();
    expect(commitment).toMatch(/^\d+$/);
    expect(identity.commitment.toString()).toBe(commitment);
  });
  it("is deterministic for the same secret", () => {
    const a = createIdentity("test-secret");
    const b = createIdentity("test-secret");
    expect(a.commitment).toBe(b.commitment);
  });
  it("differs across secrets", () => {
    expect(createIdentity("a").commitment).not.toBe(createIdentity("b").commitment);
  });
});
