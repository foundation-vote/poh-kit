// SPDX-License-Identifier: MIT OR Apache-2.0
//
// Verify the deployed identity contracts on Sourcify via its v2 HTTP API.
//
// Why not `npx hardhat verify`? Sourcify retired its v1 API (brownout from
// 2026-07-07); hardhat-verify 2.x (Hardhat 2) only speaks v1, and the v2 fix
// ships only in hardhat-verify 3.x / Hardhat 3. Rather than migrate, this hits
// the Sourcify v2 API directly — no API key, no gas.
//
// Usage:  npx hardhat compile && node scripts/verify-sourcify.mjs
// Node 18+ (uses global fetch). Reads the standard-JSON input + compiler
// version straight out of Hardhat's build-info.
import { readFileSync, readdirSync } from "node:fs";

const CHAIN_ID = "11155420"; // Optimism Sepolia
const SERVER = "https://sourcify.dev/server";
const CONTRACTS = [
  { name: "IdentityRegistry", address: "0x847833b501d5e60AB434CCFCd61b658a670a76af", id: "contracts/IdentityRegistry.sol:IdentityRegistry" },
  { name: "IdentityCommitments", address: "0xA0A2aFC80ef2CA1d34a113287Ef6d3D16321D5a5", id: "contracts/IdentityCommitments.sol:IdentityCommitments" },
  { name: "Attestations", address: "0xfE30FB91427a6dcA257b3d0c90108C78EEa3e985", id: "contracts/Attestations.sol:Attestations" },
];

function buildInfoFor(sourcePath) {
  const dir = "artifacts/build-info";
  for (const f of readdirSync(dir)) {
    const bi = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    if (bi.input?.sources?.[sourcePath]) return bi;
  }
  throw new Error(`no build-info contains ${sourcePath} — run 'npx hardhat compile' first`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const c of CONTRACTS) {
  const bi = buildInfoFor(c.id.split(":")[0]);
  const body = { stdJsonInput: bi.input, compilerVersion: bi.solcLongVersion, contractIdentifier: c.id };
  const res = await fetch(`${SERVER}/v2/verify/${CHAIN_ID}/${c.address}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const { verificationId, error } = await res.json();
  if (!verificationId) { console.log(`${c.name}: submit failed —`, error ?? res.status); continue; }
  let job;
  for (let i = 0; i < 12; i++) {
    await sleep(3000);
    job = await (await fetch(`${SERVER}/v2/verify/${verificationId}`)).json();
    if (job.isJobCompleted) break;
  }
  const m = job?.contract ?? {};
  console.log(`${c.name} ${c.address}: match=${m.match} runtime=${m.runtimeMatch} creation=${m.creationMatch}`);
}
console.log("\nBrowse: https://repo.sourcify.dev/" + CHAIN_ID + "/<address>");
