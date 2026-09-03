# Threat model

| Threat | Control | Regression evidence |
|---|---|---|
| Reporter supplies attacker JSON | No URL parameter; contract derives FDA endpoint | authority/notice rejection test |
| Wrong authority for category | Exact `FDA_FOOD` / `FDA_DRUG` binding | category mismatch test |
| FDA returns a different record | Deterministic exact recall-number check before LLM | swapped ID test |
| Prompt/evidence invents a verdict | Closed JSON vocabulary; other values collapse to uncertainty | closed surface tests |
| Authority is down or malformed | Fail closed to `UNCERTAIN`, retry allowed | 503/malformed/empty tests |
| Old report mutates a newer watch | Current-submission check | supersession test |
| Stranger claims bond | Sender equals stored reporter | reporter-only test |
| Bond replay/reentrancy | Clear value before transfer; returned flag | repeat-return test |
| False remediation | Must re-fetch the canonical source and classify termination | active/terminated test |

Residual risk: source correctness ultimately depends on FDA publication quality and validator access. The contract records `UNCERTAIN` rather than guessing when acquisition or interpretation cannot be safely completed.
