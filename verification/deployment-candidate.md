# Deployment candidate

Status: ready for a new GenLayer Studio instance.

- Source: `contracts/PublicRecallSentinel.py`
- Protocol fingerprint: `PRS-1.1.0-audit`
- Source SHA-256: `35f9f8ec90a67c3c7c2468109fb5d7cca9a98e01ea041b3b1bf5150ca067df27`
- Constructor arguments: none
- Local contract tests: `24 passed`
- Frontend production build: passed

## Mandatory post-deployment check

Before sending any lifecycle transaction, call:

```text
get_protocol_version() -> PRS-1.1.0-audit
```

Then inspect the deployed source in Explorer and confirm the authority policy through `get_source_policy()`. The lifecycle script refuses to continue if the fingerprint differs.

The former address `0xd6a356e38b585eD997A188802CC5e6f0166231c0` is evidence for the superseded pre-audit revision only.
