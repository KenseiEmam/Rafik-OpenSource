# Infrastructure

`compose.yaml` is the repository's single Compose definition. It runs PostgreSQL for local development and test workflows only. It is not the university deployment stack; production web/API services, identity, mail, file storage, secrets, backup and reverse-proxy configuration remain behind the Stage 3 self-hosting gate.

Run it through the root workspace commands (`npm run backend:start` and `npm run backend:stop`) so Prisma migrations and local service lifecycle stay consistent. Never use its synthetic credentials for hosted deployments.
