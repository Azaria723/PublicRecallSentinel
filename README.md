# Public Recall Sentinel

Public Recall Sentinel is a GenLayer dApp for independently checking whether an official FDA recall record matches a distributor's precisely registered product identity. It keeps the canonical source, reporter bond, verdict, retries, and remediation checks auditable on-chain.

Current verified deployment: `PRS-1.2.0-settlement` at `0xC04400A0B02e495731AD0a5fbc1A1f777Fe9017c`. Its deployed source bytes match this repository, and linked SEND payouts were verified through recipient credit and exact +0.001 GEN balance deltas. Do not use `0x0cd1908393c24b0426bC7Ac75901afdb14d9D3de` for new bonds: its refund child failed while accounting incorrectly reported payment. The earlier `0xd6a356e38b585eD997A188802CC5e6f0166231c0` is also superseded. See [settlement correction](verification/settlement-correction.md).

- Live dApp (Cloudflare Pages): https://public-recall-sentinel.pages.dev
- Previous Netlify deployment: https://publicrecallsentinel.netlify.app (superseded; do not use for new bonds)
- GitHub: https://github.com/Azaria723/PublicRecallSentinel

## Why GenLayer

An ordinary smart contract cannot fetch a changing public recall database or interpret whether a prose product description applies to a registered lot. GenLayer validators independently retrieve the official record and reach consensus on a deliberately closed semantic result. The contract then commits only deterministic states and accounting effects.

## Trust boundary

| Category | Accepted authority | Canonical acquisition |
|---|---|---|
| `FOOD` | `FDA_FOOD` | `https://api.fda.gov/food/enforcement.json` |
| `DRUG` | `FDA_DRUG` | `https://api.fda.gov/drug/enforcement.json` |

The reporter supplies a recall number—not a URL. The contract validates its character set, derives the exact query, rejects category/authority mismatch, fetches the record itself, and checks `recall_number` before any LLM judgment.

## State machine

`WATCHING (0) → SUBMITTED (1) → MATCH (2) | NO_MATCH (3) | UNCERTAIN (4)`

`MATCH (2) → REMEDIATED (5)` only after the official record is assessed as terminated. `UNCERTAIN` can be retried. Assessment history is append-only.

## Bond safety

`submit_notice` requires exactly 0.001 GEN. It is a refundable deposit, not a reward pool. Only the original reporter can request its return after a terminal assessment. `return_bond(id, attempt)` emits an EVM/EOA transfer and records PENDING, without clearing the debt. `reconcile_refund(id, parent_hash)` independently reads the fixed Studionet RPC, checks chain, parent calldata, attempt, parent/child linkage, parties, amount, finality and recipient credit. Only confirmed credit clears the debt. Finalized failed/uncredited transfers retain the debt and permit a new attempt, subject to sufficient reserves. Unknown results remain PENDING; there is no timeout-based duplicate payment.

Receipt verification trusts `https://studio.genlayer.com/api` on chain 61999. This is an explicit centralized testnet trust dependency, not a cryptographic receipt proof. No reporter-supplied JSON, URL or LLM verdict can authorize settlement. Failed outgoing value is not assumed to return automatically: `fund_refund_reserve()` permits donations without granting donors withdrawal rights. Recovery never spends another reporter's reserved bond.

## Local verification

```bash
python -m pip install -r requirements.txt
pytest -q
cd frontend
npm install
npm run build
```

## Deploy

Deploy `contracts/PublicRecallSentinel.py` in GenLayer Studio with no constructor arguments. Verify the deployed source against the repository source, then set:

```bash
VITE_CONTRACT_ADDRESS=0xYOUR_NEW_CONTRACT
```

Build the frontend again. Never reuse an address from another source revision.

## Studionet evidence sequence

1. Register a FOOD watch with an exact manufacturer/product/lot identity.
2. Submit a real FDA food recall number with 0.001 GEN.
3. Call `assess_notice`; capture its transaction and `get_watch`/`get_submission` results.
4. Submit a valid recall whose product does not match the watch; prove `NO_MATCH`.
5. Demonstrate an unavailable/malformed authority response in direct tests; prove `UNCERTAIN`, not `MATCH`.
6. Request refund, prove its linked SEND transaction is FINALIZED with `value_credited=true`, and record the exact recipient balance increase before running reconciliation. Then demonstrate replay returns `BOND_ALREADY_RETURNED`. The updated lifecycle/security scripts enforce this sequence; parent finality alone does not pass.

## Repository map

- `contracts/` intelligent contract
- `tests/` direct contract regression suite
- `frontend/` Vite/React dApp
- `docs/` architecture, threat model, and test procedure
- `docs/adversarial-audit.md` findings, resolutions, and residual risks
- `verification/` truthfully separated local and Studionet evidence

This is testnet software and not a replacement for official FDA safety guidance.
