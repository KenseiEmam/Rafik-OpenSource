# ADR 0017: Minimal athlete injury participation status

- **Status:** Accepted and implemented locally; university review is still required before production use, 16 October 2026
- **Decision owners:** Founder direction; university privacy/security review still required before production use

## Context

The university workflow needs an athlete-facing way to communicate participation limitations. The existing product has organization trainers and assessment records, but no health-staff grant. Treating training notes, assessment results, or messages as injury records would mix clinical and performance scopes.

## Decision

- Store only athlete-authored structured `modified` or `unavailable` participation status and effective date. No diagnosis, body area, treatment, narrative, or attachment.
- Require organization setup. For minors, an organization administrator records that guardian authorization was verified, with verifier and timestamp; no documents or guardian health information are collected. The athlete assents to the current policy version before creating a record.
- Athletes can read, correct, close, and withdraw. Withdrawal immediately removes coach visibility and blocks new entries.
- Assigned coaches see only active status and effective date for currently assigned active trainees. Admins see consent setup fields only. No health-staff role or ambient platform-operator access exists in v1.
- Log sensitive reads, changes and athlete exports. Closed record content, history and record-linked access/operation logs cascade-delete 12 months after closure. The API runs cleanup daily and at startup. A singleton, deployment-wide checkpoint retains only the last successful run time and aggregate closed/purged counts; it carries no user, organization or record identifier and survives record deletion.

## Options considered

- **Store full clinical injury records:** rejected because Rafik has no clinical care role, diagnosis model or approved health-record governance.
- **Allow an assigned coach to read a full injury narrative:** rejected because it exposes more sensitive detail than needed for training participation.
- **Introduce a separate health-staff grant in v1:** deferred because the current workflow does not model university health services or their authorization lifecycle.
- **Store only athlete-authored structured participation status with limited coach visibility:** selected to support coordination while minimizing collected and disclosed health information.

## Consequences and remaining work

This is a narrow participation coordination feature, not a clinical record or legal compliance determination. The trade-off is that it intentionally excludes diagnoses and treatment details and depends on administrator attestation for guardian authorization. Athlete export, deletion, aggregate checkpointing and the isolated database/API restart rehearsal are implemented and locally verified. Real monitoring/alert delivery, sport-task/catalog coverage and university review remain required before Stage 4 acceptance or real athlete data.

The minor-consent mechanism stores an administrator attestation rather than guardian identity evidence; each deployment must confirm that this meets its approved policy before enabling the workflow.

## Acceptance clarification — 19 October 2026

The founder accepted implementation stages and deferred non-code institution/sport/operational review to the first-user backlog. Earlier references to review before Stage 4 acceptance are superseded by that sequencing; they remain required before relying on sensitive live athlete data. See the [beta readiness table](../operations/release-checklist.md#project-beta-readiness-19-october-2026). This changes the acceptance sequence, not permissions, consent or retention behavior.
