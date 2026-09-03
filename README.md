# Public Recall Sentinel

Public Recall Sentinel is a GenLayer dApp for independently checking whether an official FDA recall record matches a distributor's precisely registered product identity. It keeps the canonical source, reporter bond, verdict, retries, and remediation checks auditable on-chain.

Current audited protocol fingerprint: `PRS-1.1.0-audit`. The earlier deployment at `0xd6a356e38b585eD997A188802CC5e6f0166231c0` is superseded and must not be submitted as the final contract.

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

`submit_notice` requires exactly 0.001 GEN. It is an anti-spam bond, not a reward pool. It is refundable to the original reporter only after `MATCH`, `NO_MATCH`, or `REMEDIATED`. Network/source failure does not slash or release it. The contract clears the stored amount before emitting the transfer, preventing replay.

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
6. Return the terminal reporter bond and demonstrate replay returns `BOND_ALREADY_RETURNED`.

## Repository map

- `contracts/` intelligent contract
- `tests/` direct contract regression suite
- `frontend/` Vite/React dApp
- `docs/` architecture, threat model, and test procedure
- `docs/adversarial-audit.md` findings, resolutions, and residual risks
- `verification/` truthfully separated local and Studionet evidence

This is testnet software and not a replacement for official FDA safety guidance.
