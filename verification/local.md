# Local verification

Date: 2026-09-03

Commands:

```text
pytest -q
........................ [100%]
24 passed
```

The suite runs the contract itself in GenLayer DirectMode with strict web/LLM mocks and pickling checks. This is local regression evidence, not a claim of a successful Studionet lifecycle.

Frontend production build completed successfully with the audited address supplied only through ignored `.env.local`. Browser verification read three live watches from Studionet—one `MATCH`, two `NO_MATCH`, and zero active reporter bonds—with no console warnings or errors.

Netlify production verification passed at https://publicrecallsentinel.netlify.app: the production bundle displays contract `0x0cd190…d9D3de`, the same three authoritative watch states, zero active bonds, no console warnings/errors, and a non-root `/audit-proof` request resolves through the SPA fallback instead of returning Netlify 404.
