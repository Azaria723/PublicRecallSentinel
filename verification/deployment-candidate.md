# Deployment candidate

Status: deployed and live payout verification passed on 2026-09-05.

- Source: `contracts/PublicRecallSentinel.py`
- Protocol: `PRS-1.2.0-settlement`
- Source file SHA-256: `b162ea8afa6049720fe6775399a0b5295c05ecd591e137856cd218766d458b30`
- Constructor arguments: none
- Direct contract tests: 48 passed
- Receipt-verifier JavaScript tests: 11 passed
- SDK lint and semantic validation: passed
- Frontend production build: passed
- Contract: `0xC04400A0B02e495731AD0a5fbc1A1f777Fe9017c`
- Explorer: https://explorer-studio.genlayer.com/address/0xC04400A0B02e495731AD0a5fbc1A1f777Fe9017c
- Live evidence: `studionet-settlement-2026-09-05.json`
- Cloudflare Pages: https://public-recall-sentinel.pages.dev
- Cloudflare deployment: https://24693c11.public-recall-sentinel.pages.dev

The old `0x0cd1908393c24b0426bC7Ac75901afdb14d9D3de` has a confirmed failed refund and must not be used as the new deployment. Do not upgrade it in place with this changed storage layout; deploy a fresh instance.

Deployed source bytes exactly matched the local file SHA-256. Positive MATCH, negative NO_MATCH, wrong-wallet and replay paths ran on Studionet. Three linked SEND children finalized with `value_credited=true`; each observed reporter balance delta was exactly +0.001 GEN. Final accounting is bonded = returned = 0.003 GEN, pending = active = 0. Evidence is committed separately.

Cloudflare production verification returned HTTP 200 for `/` and `/audit-proof`; the published bundle contains the new contract and protocol fingerprint and does not contain the superseded address. The unique deployment hostname initially returned a transient TLS handshake error during a second verification request; the production alias passed.
