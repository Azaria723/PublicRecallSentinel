# Studionet verification

> Superseded revision: these transactions prove the original lifecycle on contract `0xd6a3…31c0`, but that instance predates the adversarial-audit fixes in `PRS-1.1.0-audit`. Do not use it as the final submission contract. A new deployment and fresh lifecycle evidence are required.

Date: 2026-09-03

Contract: `0xd6a356e38b585eD997A188802CC5e6f0166231c0`

Explorer: https://explorer-studio.genlayer.com/address/0xd6a356e38b585eD997A188802CC5e6f0166231c0

Actor: `0x67A1A08Fc4cf7D05c859d0d3D8398a3A30B1677e`

## Positive lifecycle

Official FDA record: food recall `F-1170-2024`, status `Ongoing`, recalling firm `HandNatural`.

1. `register_watch`: https://explorer-studio.genlayer.com/transactions/0xe1eeda014f82cf4c9eaa05892350892afb3ad70a3d0ba4fd37c4018fd26c70fb
2. `submit_notice` with 0.001 GEN: https://explorer-studio.genlayer.com/transactions/0xeca8e7bebaa623d2cebc430de74b8304cda7874e085210000e81e812762ea846
3. `assess_notice`: https://explorer-studio.genlayer.com/transactions/0x119a6d03a9bdeda6a52a49fd2ed9fad74386d08d3f5c9c90b6b895226dd2c048
4. `return_bond`: https://explorer-studio.genlayer.com/transactions/0xa613ba8162c71fa0c5cba69c6478849e3f63e8703089856d4bc0a0b7a10c9313

Authoritative readback: watch `#0` is state `2`, verdict `MATCH`. Submission bond is returned and stored `bond_wei` is zero.

## Negative lifecycle

The same official recall was assessed against an unrelated frozen-peas watch with identifier `LOT-Z9`.

1. `register_watch`: https://explorer-studio.genlayer.com/transactions/0x926cbbeb9774309304167ba94c4d754515bc8aa35b8d8d28157e10bc1c99b88c
2. `submit_notice` with 0.001 GEN: https://explorer-studio.genlayer.com/transactions/0x0a5efaea0b9afe3264b803fda8c9948e67a33f02768ad55e6bbeaa5e41ac7b54
3. `assess_notice`: https://explorer-studio.genlayer.com/transactions/0x323af9f1d1e1175d2772fe43c1332bde27722bf1026c5ccdc20d2fd84591c67a
4. `return_bond`: https://explorer-studio.genlayer.com/transactions/0x5f8bfd72dfafc3c30671a7235d6f420a32eb0d51b6980319e75ae6c6aeda493f

Authoritative readback: watch `#1` is state `3`, verdict `NO_MATCH`.

## Final accounting

```json
{"active_bonds":"0","total_bonded":"2000000000000000","total_returned":"2000000000000000"}
```

Final counts: two watches, two submissions, and two independent assessments. All eight transactions reached `FINALIZED`. These are live Studionet results; unavailable-source and adversarial-input behavior remains covered by the direct contract regression suite.
