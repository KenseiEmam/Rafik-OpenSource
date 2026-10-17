# ADR 0020: Publish programs directly to the institution library

- **Date:** 17 October 2026
- **Status:** Accepted

## Context

Program authors had to publish an immutable version and then separately change a catalog visibility setting. The second step acted as a hold that was easy to miss and had no clear role in the university workflow. New programs also opened with fictional sample exercises rather than an accurate empty state.

## Options

1. Keep publication and library visibility as separate actions.
2. Make successful publication automatically list the program; keep assignment as a separate decision.

## Decision

Use option 2. Saving creates or updates an incomplete or complete draft. Publishing validates the prescription, creates an immutable version and makes the program available in the institution library. Assignment remains explicit. New program drafts start with one empty session and never insert sample exercises.

## Trade-offs

Published programs become discoverable to authorized institution members immediately. This is appropriate for an institution-owned library; authors use draft save while work is incomplete. Draft writes validate structure and bounded metadata, while publication performs full exercise validation. Existing published programs are migrated into the visible library. The legacy `listed` database column remains as the visibility implementation detail, but active UI and commands no longer expose a separate hold.
