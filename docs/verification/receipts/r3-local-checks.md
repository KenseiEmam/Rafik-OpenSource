# R3 local verification receipt — 22 September 2026

- Backend: 135 rollback assertions; six-migration disposable database suite passed.
- Local HTTP: simultaneous booking, dual-role conflicts, private byte access/revocation/removal and synthetic account cleanup passed.
- SQL lint: no schema errors.
- Web: 10 unit tests; 36 full browser scenarios; six final affected-flow reruns passed.
- R3 render matrix: 128 states, zero overflows/page errors, zero Axe violations in 32 checked phone states.
- Production build/typecheck and formatting passed.
- Preview preserved; no hosted, mobile, external messaging, payment, remote CI or physical-device verification.

See ../verification.md for scope and reproducible source paths. Raw local artifacts are intentionally ignored and contain synthetic examples only.
