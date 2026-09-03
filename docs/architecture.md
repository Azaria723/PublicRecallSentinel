# Architecture and invariants

## Data flow

`registered identity → recall ID → contract-derived FDA URL → validator fetch → exact ID check → closed semantic judgment → on-chain state`

The user never selects the evidence host. The first deterministic gate checks HTTP success, response size, JSON shape, exactly one result, and exact recall number. Only then does equivalence-principle execution compare manufacturer, product, and identifier and classify current recall status.

## Closed outputs

- Identity: `MATCH`, `NO_MATCH`, `UNRESOLVED`
- Notice: `ACTIVE`, `TERMINATED`, `UNKNOWN`
- Contract state: `MATCH`, `NO_MATCH`, `UNCERTAIN`, `REMEDIATED`

Anything outside the closed vocabulary becomes `UNCERTAIN`. Fetch exceptions, non-200 responses, oversized bodies, malformed JSON, and ambiguous result counts also become `UNCERTAIN`.

## Invariants

- Category fixes authority and endpoint.
- A response cannot reach semantic evaluation until its recall ID equals the submitted ID.
- Only the current submission can mutate a watch.
- Every assessment gets a new append-only record.
- Source failure never becomes a positive decision.
- Only the reporter can recover that submission's bond.
- A returned bond cannot be returned twice.
