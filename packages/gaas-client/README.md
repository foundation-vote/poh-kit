# @poh-kit/gaas-client

TypeScript SDK client for the Foundation Proof of Humanity API.

## Install

```bash
npm install @poh-kit/gaas-client
```

## Quick start

```ts
import { PohClient, PohApiError } from "@poh-kit/gaas-client";

const client = new PohClient("poh_live_your_api_key");

// 1. Verify an ePassport ZK proof
const result = await client.verifyPassport(
  "att_9f3a2b1c",
  { pi_a: "...", pi_b: "...", pi_c: "..." },
  { nullifier: "0x...", timestamp: 1234567890 },
);
console.log(result.nullifier, result.trustTier);

// 2. Attach a Semaphore commitment (requires Bearer JWT)
await client.attachCommitment("12345678901234567890", bearerToken);

// 3. Retrieve the Semaphore group
const group = await client.getGroup();
console.log(group.memberCount, group.merkleRoot);

// 4. Cast an anonymous vote
const vote = await client.anonymousVote(
  "prop_abc123",
  "opt_yes",
  semaphoreProof,
  nullifier,
  signal,
  externalNullifier,
);
console.log(vote.transactionSignature);

// 5. Check verification status
const status = await client.getProofStatus(result.nullifier);
console.log(status.exists, status.hasCommitment);
```

## Error handling

All API errors throw a `PohApiError` with `status`, `code`, and `message` fields:

```ts
try {
  await client.verifyPassport(/* ... */);
} catch (err) {
  if (err instanceof PohApiError) {
    console.error(`API error ${err.status}: ${err.message}`);
  }
}
```

## Custom base URL

```ts
const client = new PohClient("poh_live_key", {
  baseUrl: "http://localhost:3000",
});
```

## Open client, closed service

This SDK and the [API spec](../../docs/api/poh-verification-api.yaml) are
MIT/Apache-2.0. The hosted multi-tenant service behind the default base URL is
Foundation's commercial offering; you can also implement the spec yourself and
point `baseUrl` at your own deployment.
