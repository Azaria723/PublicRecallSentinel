# Verification plan

## Direct contract tests

- Happy lifecycle: watch, report, canonical fetch, match, refund.
- Negative identity classification.
- Authority mismatch and URL-shaped/traversal notice rejection.
- Exact payable amount and atomic failure.
- Swapped recall ID rejected before semantic evaluation.
- HTTP 503, malformed JSON, and empty results fail closed.
- Retry after uncertainty retains assessment history.
- Unknown model vocabulary fails closed.
- Only reporter can return a bond; replay is harmless.
- Active recall cannot be marked remediated; terminated recall can.
- Superseded submissions cannot mutate current state.

## Frontend checks

- Production build succeeds.
- No default contract address or private key is bundled.
- Wallet must be on Studionet 61999.
- Write controls are locked while awaiting finality.
- A pending transaction hash is persisted to avoid accidental duplicates.
- UI refreshes authoritative contract state after finality and tells the user to inspect the business return value.

## After deployment

- Compare deployed source and exposed methods with this commit.
- Execute one matching, one non-matching, one retry, and one bond-return lifecycle.
- Record address, commit, transaction links, arguments, return values, and readback in `verification/studionet.md`.
