# ADR 0022: Keep instance branding local and support data under university control

**Date:** 17 October 2026  
**Status:** Accepted for Stage 5 implementation

## Context

Each university operates its own Rafik instance. Instance branding must survive application updates, while support must not silently move university or athlete data outside that instance. Stage 5 needs a default that is safe for self-hosters and practical to operate.

## Options

1. Send support cases and diagnostics to a central Rafik service by default.
2. Keep support records local by default and add any outbound channel only as a separate, explicit opt-in.
3. Omit support workflows entirely and ask operators to use deployment logs.

## Decision

- Keep support records and diagnostics inside the university-controlled instance by default. Do not add outbound telemetry, email delivery, or central support transfer without a separate opt-in design.
- A support request must identify its destination before submission. A university support request stays in that institution; a Rafik-directed request remains a local record until an outbound service is explicitly configured.
- Never attach injury records, private messages, files, or other athlete content automatically to a support request or diagnostic export. A future export must preview exactly what it contains and require a deliberate user action.
- Add deployment-level branding with Rafik defaults and visible attribution. Limit branding to supported logo and theme settings; do not allow arbitrary CSS or scripts. Preserve user theme choice and keep a safe default when custom assets are missing.
- Store branding as instance configuration so it survives image and application upgrades. Restrict changes to the instance super administrator and document the backup/restore behavior.

## Trade-offs

Local-only support cannot create a central Rafik support queue without an operator-configured integration. This keeps data within the university boundary and avoids requiring a Rafik-hosted service. Supported logo/theme controls add implementation and backup responsibilities; arbitrary styling remains out of scope.

## Implementation status

The support page stores requests in the current installation and now discloses that there is no email or external delivery, who can read each destination, and that athlete health details or private files should not be included. Stage 5 still needs deployment-level branding and focused privacy/accessibility acceptance.
