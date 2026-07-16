// SPDX-License-Identifier: MIT OR Apache-2.0
import { afterEach, describe, expect, it, vi } from "vitest";
import { PohClient } from "./client.js";
import { PohApiError } from "./errors.js";

function mockFetchOnce(status: number, body: unknown) {
  // Use mockImplementation (not mockResolvedValue) so each call gets a fresh
  // Response instance — a shared instance would throw "body already read" on
  // any second res.json() call against the same mock (e.g. two assertions
  // against the same error response in one test).
  const fn = vi.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }),
    ),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("PohClient", () => {
  it("throws if baseUrl is not provided (no public default endpoint)", () => {
    // @ts-expect-error — options is required; verify the runtime guard too
    expect(() => new PohClient("poh_live_k")).toThrow(/baseUrl` is required/);
    expect(() => new PohClient("poh_live_k", { baseUrl: "" })).toThrow(/baseUrl` is required/);
  });

  it("verifyPassport POSTs to /api/v1/poh/verify-passport with the API key", async () => {
    const fetchMock = mockFetchOnce(200, { nullifier: "n1", trustTier: "high", verifiedAt: "t" });
    const client = new PohClient("poh_live_k", { baseUrl: "https://api.example.com" });
    const res = await client.verifyPassport("1", {}, {});
    expect(res.nullifier).toBe("n1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.example.com/api/v1/poh/verify-passport");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("X-PoH-API-Key")).toBe("poh_live_k");
  });

  it("attachCommitment sends the Bearer token", async () => {
    const fetchMock = mockFetchOnce(200, { success: true, commitment: "c" });
    const client = new PohClient("poh_live_k", { baseUrl: "https://api.example.com" });
    await client.attachCommitment("c", "jwt-123");
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer jwt-123");
  });

  it("non-2xx responses throw PohApiError with status and code", async () => {
    mockFetchOnce(409, { error: "NULLIFIER_ALREADY_USED" });
    const client = new PohClient("poh_live_k", { baseUrl: "https://api.example.com" });
    await expect(client.verifyPassport("1", {}, {})).rejects.toThrowError(PohApiError);
    await expect(client.verifyPassport("1", {}, {}).catch((e) => { throw Object.assign(e, {}); }))
      .rejects.toMatchObject({ status: 409, code: "NULLIFIER_ALREADY_USED" });
  });

  it("getProofStatus URL-encodes the nullifier", async () => {
    const fetchMock = mockFetchOnce(200, { exists: false, nullifier: "a/b", hasCommitment: false });
    const client = new PohClient("poh_live_k", { baseUrl: "https://api.example.com" });
    await client.getProofStatus("a/b");
    expect(fetchMock.mock.calls[0][0]).toContain("/api/v1/poh/status/a%2Fb");
  });
});
