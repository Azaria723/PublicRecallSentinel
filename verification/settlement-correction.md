# Settlement correction — deployed and live-verified

## Live resolution (2026-09-05)

Fresh contract `0xC04400A0B02e495731AD0a5fbc1A1f777Fe9017c` has exact deployed-source byte parity with SHA-256 `b162ea8afa6049720fe6775399a0b5295c05ecd591e137856cd218766d458b30`. Positive MATCH, negative NO_MATCH, wrong-wallet and replay paths passed. Three reporter payouts used linked SEND transactions (type 0), finalized with `value_credited=true`, and each produced an observed +0.001 GEN recipient balance delta before reconciliation. Wrong-wallet and replay transactions emitted no child transfer. Final accounting is 0.003 GEN bonded, 0.003 GEN returned, zero pending and zero active liabilities. Exact hashes are in `studionet-settlement-2026-09-05.json`.

## Reproduced reviewer finding (2026-09-05)

Old contract: `0x0cd1908393c24b0426bC7Ac75901afdb14d9D3de`.

Parent `0x02ddd161b9fe51073bedcf9e37d7dfb2fc80ecf5622dd967600b1b77eb2af753` finalized SUCCESS, returning BOND_RETURNED. Its linked child `0xcdb4e1936e390058c3b62e3f9db9a83ff2934e654d5597c85575561d40eafed8` finalized ERROR: `Contract 0x67A1A08Fc4cf7D05c859d0d3D8398a3A30B1677e not found`. Child type was RUN_CONTRACT (2), value 1000000000000000 wei, `value_credited=false`. Current old-contract balance read 0 wei. This is NOT evidence of reporter receipt, and the old accounting cannot recover the payment.

Reproduce read-only: `node scripts/trace-refund.mjs`. Raw selected fields are committed in `legacy-refund-failure.json`.

Cause: `gl.get_contract_at(reporter).emit_transfer` dispatches an Intelligent Contract receive call. A wallet is not an IC. The source also counted emission as payment, and earlier scripts only tested that incorrect accounting. Local DirectMode mocks did not execute the child transfer.

## Changes in PRS-1.2.0-settlement

- Use `@gl.evm.contract_interface` and an empty-calldata value transfer to the reporter.
- Split REQUESTED/PENDING from PAID. Preserve bond amount and liability until confirmation.
- Query only the fixed GenLayer Studionet RPC (chain 61999). Validate actual parent call arguments including submission and monotonic attempt, parties, finality, child hash linkage, SEND type (0), amount and `value_credited=true`. No semantic AI decision for payments.
- Unknown or contradictory receipts fail closed, leaving PENDING. A finalized ERROR with explicit no-credit evidence permits retry, never a pending timeout.
- Retry cannot consume another bond's reserve. Failed debited funds may need a reserve donation; donations have no withdrawal rights. This is retryable application accounting, not an assertion of atomic cross-transaction rollback.
- UI rejects old protocol revisions and distinguishes request finality from payment. Pending requests can be reconciled by parent hash after reload.
- Live scripts require successful linked child receipt AND exact recipient balance delta before reconciliation. Use an idle test wallet; unexplained fees/activity cause a test failure rather than a false pass.

## Trust / limits

The fixed HTTPS RPC is an authoritative Studionet API but not a cryptographic proof. RPC compromise could falsify settlement; outage or incompatible schemas keep refunds pending. No administrator or reporter can submit their own receipt JSON or switch that source. Deployment on another chain needs a separately reviewed settlement adapter.

Old lost transfers are not repaired by deploying a new instance. Do not claim they were reimbursed. Recovering their underlying value may require platform assistance; no manual compensating payout has been sent.

## Verification and remaining gate

Local direct-contract regressions exercise actual request/reconciliation methods with mocked transport and external message emission. They validate accounting, failed transfers, attempt replay, wrong sender/recipient/value, forged linkage and uncertain receipts; they do NOT prove network delivery. Frontend production build and SDK semantic validation are separate checks.

User deploys `contracts/PublicRecallSentinel.py` with **no constructor arguments**. Then:

1. Read back source, protocol version and empty accounting; record deployed source SHA-256.
2. Set frontend `VITE_CONTRACT_ADDRESS` to the new address, rebuild and publish.
3. Run positive MATCH and negative NO_MATCH lifecycles using the new scripts.
4. For each refund record parent hash, linked SEND hash, FINALIZED, recipient, amount, `value_credited=true`, recipient balances before/after, reconciliation hash and PAID state.
5. Run wrong-wallet/replay tests. Confirm no second child transfer and no extra recipient credit.
6. Commit the new live evidence, deploy the updated frontend, then resubmit with an honest explanation of the old failed payout and the new proven design. The contract/live-proof portion is complete; repository push and frontend publication are the remaining release steps.

## Primary references

- [GenLayer value transfers](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers)
- [GenLayer messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages)
- [Studio implementation reviewed at c940729](https://github.com/genlayerlabs/genlayer-studio/blob/c94072951e483510329670aa427fba3fa6944f45/backend/consensus/base.py): external messages create SEND children; native send processing credits recipient and records `value_credited`. Deployed receipts still must be checked because main-branch implementation is not proof of deployed behavior.
