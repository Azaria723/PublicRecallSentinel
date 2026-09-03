# Studionet verification

Date: 2026-09-03

Contract: `0x0cd1908393c24b0426bC7Ac75901afdb14d9D3de`

Explorer: https://explorer-studio.genlayer.com/address/0x0cd1908393c24b0426bC7Ac75901afdb14d9D3de

Source revision: `PRS-1.1.0-audit`

Source SHA-256: `35f9f8ec90a67c3c7c2468109fb5d7cca9a98e01ea041b3b1bf5150ca067df27`

Preflight readback confirmed `get_protocol_version() == PRS-1.1.0-audit`, zero initial counts, zero accounting, and exact FOOD/DRUG policies rooted at `https://api.fda.gov`.

## Positive lifecycle

Official FDA record: food recall `F-1170-2024`, status `Ongoing`, recalling firm `HandNatural`.

1. [`register_watch`](https://explorer-studio.genlayer.com/transactions/0xb31636ef7e18706e75477345eae3c1d79387ac6ec431885c0e7a561cfde448c9)
2. [`submit_notice` with 0.001 GEN](https://explorer-studio.genlayer.com/transactions/0x20d63df07236aaf6b2bfb0946f4d492275a684b6df69f5c432349e57e0ada3ab)
3. [`assess_notice`](https://explorer-studio.genlayer.com/transactions/0x6e842391da0380fa53e0a41939ee76b25c1217e6484526938826fcd3eece517c)
4. [`return_bond`](https://explorer-studio.genlayer.com/transactions/0x02ddd161b9fe51073bedcf9e37d7dfb2fc80ecf5622dd967600b1b77eb2af753)

Authoritative readback: watch `#0` is state `2`, verdict `MATCH`, and `ever_matched=1`. Submission bond was returned and its stored `bond_wei` became zero.

## Negative lifecycle

The same official recall was assessed against an unrelated frozen-peas watch with identifier `LOT-Z9`.

1. [`register_watch`](https://explorer-studio.genlayer.com/transactions/0x3059879ae5422ca2a1d40a387b04c5b30ff7877ccd4aee55d31dbcbd908d585e)
2. [`submit_notice` with 0.001 GEN](https://explorer-studio.genlayer.com/transactions/0xde9ddcb2cad9985b2806c68dcf7107288637217f2ff9b7f66b49cc8d26bb82c2)
3. [`assess_notice`](https://explorer-studio.genlayer.com/transactions/0xdd8786a56369bf7dc670b7aac15280b1fb0dd36eaf6f142157ad019028160ee1)
4. [`return_bond`](https://explorer-studio.genlayer.com/transactions/0x5b69a2992a037c1957fe5d6bc9a8750e51337055ad880439f49af19dd8e8a99b)

Authoritative readback: watch `#1` is state `3`, verdict `NO_MATCH`, and `ever_matched=0`.

## Wrong-actor and replay lifecycle

A third terminal submission proves bond isolation and replay protection.

1. [`register_watch`](https://explorer-studio.genlayer.com/transactions/0x5287830a94c149c8a3c8462f4ba94fb0c82e87ef0a02ac86e815d4082025fbe3)
2. [`submit_notice` with 0.001 GEN](https://explorer-studio.genlayer.com/transactions/0xddf6f98a789a309cffc3fef9df9bcd6f7c490bb6af89f816a9f40f9a5b5ce0cb)
3. [`assess_notice`](https://explorer-studio.genlayer.com/transactions/0x86ff7072d1a90f1304d964a9d3faf941e41215908f708a871ca04e60556e8858)
4. [Wrong wallet calls `return_bond`](https://explorer-studio.genlayer.com/transactions/0x18812e7c75c55c77cd06691d9ea15bb2b048a8c094f6b8de794639bee2f348de)
5. [Reporter calls `return_bond`](https://explorer-studio.genlayer.com/transactions/0x320c5b50c3da8391be65a571b330ca817eaef4b1e76113c0db4ec42c44a0cdce)
6. [Reporter replay attempt](https://explorer-studio.genlayer.com/transactions/0x880184967a67e3babff5b31644ce97724376e20caad953c38e2ffb8d2fac5ff2)

After the wrong-wallet call, authoritative readback remained `bond_returned=0` and `bond_wei=1000000000000000`. After the reporter call, it became `bond_returned=1` and `bond_wei=0`. The replay produced no further mutation.

## Final accounting

```json
{"active_bonds":"0","total_bonded":"3000000000000000","total_returned":"3000000000000000"}
```

Final state: three watches, three submissions, three assessments, and no stranded GEN bond. All listed transactions reached `FINALIZED`. Unavailable-source, malformed/oversized response, prompt injection, invalid payable state, and per-submission isolation remain covered by the 24-test direct contract suite.

## Superseded deployment

The earlier address `0xd6a356e38b585eD997A188802CC5e6f0166231c0` predates the adversarial-audit fixes and must not be submitted as the final contract.
