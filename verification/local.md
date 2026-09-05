# Local verification — 2026-09-05

Revision: PRS-1.2.0-settlement (not yet live deployed).

| Check | Result |
|---|---|
| `python -m pytest tests -q` | 48 passed |
| `node --test tests/settlement-proof.test.mjs` | 11 passed |
| `python -X utf8 -c "from genvm_linter.cli import cli; cli()" check contracts/PublicRecallSentinel.py` | Lint and SDK validation passed |
| Frontend `npm run build` | Passed; vendor annotation and bundle-size warnings remain |

DirectMode runs the actual contract methods. Web/LLM data, receipt transport and outbound EthSend execution are controlled mocks. Tests assert external empty-calldata transfer emission, preserved liabilities while pending, evidence binding, caller authorization, credit confirmation, failed payout retry, reserve isolation and replay protection. They do not execute an actual recipient transfer. Receipt-oracle tests use mocked API data, not user-authored evidence accepted by the deployed contract.

The historical browser observation of zero active bonds was based on incorrect old accounting and does not prove receipt. New frontend source blocks bond submissions against the old protocol. New production deployment and browser/live payout evidence remain pending the new contract address.
