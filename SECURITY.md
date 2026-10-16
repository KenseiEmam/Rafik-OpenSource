# Security Policy

Rafik is an open-source project intended for university-operated deployments. Security reports help maintainers protect universities, athletes, and operators using the software.

## Supported versions

There are no published releases currently designated for security support. Until a release support policy is published, please report issues found in the latest code. Self-hosting operators are responsible for securing and maintaining their deployment, its infrastructure, secrets, data, and backups.

## Reporting a vulnerability

Please do not disclose exploitable vulnerabilities in public issues, discussions, or pull requests. If GitHub private vulnerability reporting is enabled for this repository, use **Security → Advisories → Report a vulnerability** to contact maintainers privately. If that option is unavailable, open a brief public issue asking for the current private reporting channel; do not include exploit details, sensitive data, or proof-of-concept code in that issue.

Include the affected version or commit, impact, relevant configuration, and clear reproduction steps. Use a minimal proof of concept and avoid real athlete, health, account, or other personal data. Do not access, modify, or delete data that is not yours, or test systems without authorization.

Maintainers will coordinate with the reporter on validation, remediation, and disclosure. Response and fix times are not guaranteed. Please allow maintainers reasonable time to investigate and prepare a fix before public disclosure.

## Scope

This policy covers security issues in Rafik's source code, release artifacts, and documented deployment configuration. It does not authorize testing university or third-party deployments, infrastructure, accounts, or services. Report suspected exposure to the operator of the affected deployment as well as the project when relevant.

This policy describes a reporting process; it does not assert a security certification, compliance status, or acceptance into any external program.

## Credentials and secret material

Do not commit private keys, service-account keys, cloud credentials, passwords, API tokens, or production environment files. Deployments must not require Google service-account keys; use university-controlled local infrastructure and explicitly configured adapters such as SMTP. Treat any credential found in current files or Git history as compromised: revoke/rotate it immediately, remove the material from all reachable Git history, and notify affected operators. Removing a secret from the latest tree alone does not make an exposed credential safe.
