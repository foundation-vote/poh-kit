// SPDX-License-Identifier: MIT OR Apache-2.0
//
// End-to-end poh-kit flow on a local Hardhat chain:
//   1. deploy IdentityCommitments + Attestations
//   2. two users create Semaphore identities (core)
//   3. their verified identities land in a NullifierStore (verifier)
//   4. commitments are anchored on-chain (IdentityCommitments)
//   5. tier groups are built (verifier)
//   6. one user casts an anonymous Semaphore signal — generated with
//      @semaphore-protocol/proof (downloads snark artifacts on first run)
//   7. a replayed signal is rejected; a VERIFIED_HUMAN attestation is issued
import { ethers } from "hardhat";
import { createIdentity, AttestationKind } from "@poh-kit/core";
import {
  buildGroups, verifySemaphoreSignal,
  InMemoryGroupStore, InMemoryNullifierStore, InMemoryUsedSignalStore,
} from "@poh-kit/verifier";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";

async function main() {
  const [admin, relayer] = await ethers.getSigners();

  // 1. Deploy the identity contracts
  const commitments = await (await ethers.getContractFactory("IdentityCommitments")).deploy(admin.address);
  const attestations = await (await ethers.getContractFactory("Attestations")).deploy(admin.address);
  await commitments.connect(admin).grantRole(await commitments.RELAYER_ROLE(), relayer.address);
  await attestations.connect(admin).grantRole(await attestations.RELAYER_ROLE(), relayer.address);
  console.log("deployed IdentityCommitments + Attestations");

  // 2-3. Two verified humans (passport verification is mocked here — see
  // packages/verifier/src/passport.ts for the real Self Protocol flow)
  const alice = createIdentity("alice-secret");
  const bob = createIdentity("bob-secret");
  const nullifiers = new InMemoryNullifierStore();
  for (const [subject, poh, tier] of [["alice", alice, "high"], ["bob", bob, "medium"]] as const) {
    await nullifiers.put({
      nullifier: `demo-null-${subject}`, commitment: poh.commitment,
      proofType: "self-passport", attestationId: 1,
      verifiedAt: new Date().toISOString(),
      disclosures: [{ kind: "humanity" }], subject, trustTier: tier,
    });
  }

  // 4. Anchor commitments on-chain (uid = keccak of the subject key)
  for (const [subject, poh] of [["alice", alice], ["bob", bob]] as const) {
    const uid = ethers.keccak256(ethers.toUtf8Bytes(subject));
    const hash = ethers.keccak256(ethers.toUtf8Bytes(poh.commitment));
    await commitments.connect(relayer).anchor(uid, hash);
    console.log(`anchored ${subject}'s commitment:`, await commitments.getCommitment(uid));
  }

  // 5. Build tier groups
  const groups = new InMemoryGroupStore();
  const built = await buildGroups(nullifiers, groups);
  console.log("groups:", Object.fromEntries(Object.entries(built).map(([t, g]) => [t, g.memberCount])));

  // 6. Alice casts an anonymous signal in the medium-tier group
  const scope = "proposal-42";
  const group = new Group(built.medium.commitments.map((c) => BigInt(c)));
  const proof = await generateProof(alice.identity, group, "approve", scope);
  const used = new InMemoryUsedSignalStore();
  const res = await verifySemaphoreSignal({ proof, minTier: "medium", scope }, { groups, usedSignals: used });
  console.log("first signal:", res);
  if (!res.ok) throw new Error("expected first signal to verify");

  // 7a. Replay is rejected
  const replay = await verifySemaphoreSignal({ proof, minTier: "medium", scope }, { groups, usedSignals: used });
  console.log("replayed signal:", replay);
  if (replay.ok || replay.code !== "ALREADY_SIGNALED") throw new Error("expected replay rejection");

  // 7b. Issue the soulbound VERIFIED_HUMAN attestation. The anonymous
  // Semaphore signal above carries no EVM address by design, so this demo
  // attests to the admin signer's address as a stand-in recipient — in
  // production the recipient is whatever address the app binds the
  // verified identity to (e.g. a smart-account or relayer-submitted EOA).
  const aliceAddr = await admin.getAddress();
  await attestations.connect(relayer).issue(aliceAddr, AttestationKind.VERIFIED_HUMAN, ethers.ZeroHash);
  console.log("VERIFIED_HUMAN attested:", await attestations.hasAttestation(aliceAddr, AttestationKind.VERIFIED_HUMAN, ethers.ZeroHash));

  console.log("\n✅ end-to-end flow complete");
}

main()
  // Hardhat's in-process network can leave the event loop alive after
  // main() resolves, so exit explicitly rather than hang forever.
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
