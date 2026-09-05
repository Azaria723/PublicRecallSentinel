# Adversarial audit

> 2026-09-05 correction: this historical audit missed failed child settlement. It is not an assurance of paid bonds. The new settlement design, reproduced failure and remaining deployment gate are documented in `verification/settlement-correction.md` and `verification/local.md`.

Date: 2026-09-03

Audited revision: `PRS-1.1.0-audit`

## Scope

Manual state-machine and trust-boundary review plus executable DirectMode regression tests. Areas reviewed: payable entry points, caller authorization, replay, submission replacement, canonical-source derivation, hostile inputs and evidence, malformed/oversized responses, closed validator outputs, remediation, frontend state reconciliation, and deployment parity.

## Findings resolved

### A-01 — Submission bond used global watch state (high)

The original `return_bond` checked the watch's current state. A later submission could therefore supply the terminal state used to release an older submission's bond. Reporter authorization prevented theft, but the release proof was bound to the wrong object.

Resolution: every submission now stores its own state and verdict. Bond release checks that submission's terminal assessment.

### A-02 — Uncertain submission replacement could strand bond semantics (high)

The original state machine allowed a new notice while the current one was `UNCERTAIN`. The old bond then depended on later watch activity.

Resolution: an uncertain submission must be retried. New notices are accepted only from `WATCHING`, `NO_MATCH`, or terminal/remediated state.

### A-03 — Payable invalid-state paths returned instead of reverting (high)

An invalid payable call could return a business error after GEN was attached, risking funds being retained without creating a submission.

Resolution: missing watches and closed watch states now raise `UserError`, reverting the payable call atomically.

### A-04 — Unknown notice state could produce a positive match (medium)

`identity=MATCH` with `notice_state=UNKNOWN` previously mapped to active `MATCH`.

Resolution: positive active state now requires the exact pair `MATCH + ACTIVE`; `MATCH + UNKNOWN` fails closed to `UNCERTAIN`.

### A-05 — Frontend could associate submission zero with an untouched watch (medium)

An untouched watch has a default current-submission value of zero, which could display another watch's first submission.

Resolution: state `WATCHING` never resolves a current submission in the UI.

### A-06 — Older refundable bonds disappeared from the primary card (medium)

After a later notice, a terminal older submission was no longer the current card and its refund control was hidden.

Resolution: the frontend now derives a separate recoverable-bonds tray from all loaded submissions.

### A-07 — User-controlled watch text not explicitly identified as untrusted (low)

Resolution: the consensus prompt explicitly treats both the watch and FDA record as data, never instructions. Closed output validation remains the authoritative guard.

## Controls verified

- Contract derives the exact FDA origin and path; callers cannot submit evidence URLs.
- Recall-number character allowlist excludes query delimiters, quotes, percent escapes, and slashes.
- Exact recall identity is checked before semantic evaluation.
- Fetch failure, wrong root type, malformed JSON, empty results, oversized body, invalid model JSON, unknown status, and unknown vocabulary fail closed.
- Current-submission binding blocks stale mutation.
- Per-submission reporter authorization and checks-effects-interactions block theft and replay.
- Assessment history is append-only.
- Protocol fingerprint `PRS-1.1.0-audit` makes wrong deployment detection explicit.
- Frontend persists pending hashes, prevents duplicate writes, waits for finality, and then performs authoritative readback.

## Verification result

`24 passed` in the direct contract suite and the production frontend build succeeds. The previous Studionet address is intentionally marked superseded. A fresh instance must expose `get_protocol_version() == "PRS-1.1.0-audit"` before any new lifecycle script will run.

## Residual risks

- FDA availability and publication correctness remain external dependencies; outage returns `UNCERTAIN`.
- Semantic consensus can still be conservative or disagree; the strict equivalence principle and closed vocabulary prevent arbitrary settlement output.
- The frontend currently loads the global ledger and should add pagination if usage grows materially.
- This is an application-level adversarial review, not a third-party formal audit.
