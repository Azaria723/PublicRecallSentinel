# Public Recall Sentinel — build plan

## Goal

Create a product-safety dApp that turns an FDA recall number into an authority-bound, independently verified on-chain decision. This is not an escrow clone: the core primitive is a continuously re-checkable product watch and its assessment history.

## Protocol design

1. A watch owner fixes distributor, category, manufacturer, product, and lot/UPC/NDC identity.
2. A reporter posts an exact 0.001 GEN anti-spam bond and a recall number.
3. The contract derives the canonical `api.fda.gov` URL. No evidence URL is accepted from the reporter.
4. Validators fetch the official record, enforce exact recall-number identity, and then classify product identity plus notice status.
5. The state machine closes on `MATCH`, `NO_MATCH`, `UNCERTAIN`, or `REMEDIATED`; unavailable or malformed sources are always `UNCERTAIN`.
6. A terminal assessment permits only the original reporter to recover the bond. Transfer is checks-effects-interactions and replay-protected.

## Delivery gates

- Direct contract regression suite, including adversarial and unavailable-source cases.
- Frontend build with authoritative post-transaction readback.
- Source/ABI parity check after deployment.
- Studionet positive and negative lifecycle evidence before submission.
