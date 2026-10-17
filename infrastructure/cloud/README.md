# Optional cloud VM templates

These provider-specific Terraform starters provision one Ubuntu VM and prepare it to run Rafik's existing Docker Compose deployment. They do not create a managed database or a high-availability architecture. That keeps each deployment close to the supported self-host model, but leaves patching, PostgreSQL, private files and recovery under the university operator's care. Defaults are economical starter shapes (about 2 vCPU and 4 GiB RAM); compare live regional prices and availability before applying.

## Choose a provider

| Provider | Template | Operator access | Default host size |
| --- | --- | --- | --- |
| AWS | [EC2](aws/README.md) | Systems Manager Session Manager; no inbound SSH rule | 2 vCPU, 4 GiB RAM, 50 GiB encrypted EBS |
| Google Cloud | [Compute Engine](gcp/README.md) | OS Login through IAP; no service-account key | 2 vCPU, 4 GiB RAM, 50 GiB balanced disk |
| Azure | [Linux VM](azure/README.md) | Azure Run Command; optional restricted SSH | 2 vCPU, 4 GiB RAM, 64 GiB Standard SSD |

These are starter sizes, not capacity guarantees. Every provider bills for an always-on VM, disk, public IP/network traffic and any selected DNS/domain or monitoring services. Charges vary by region, account and date; use the provider's calculator before applying.

## Shared behavior

- Each module creates provider-specific networking, a public address for the app, and an encrypted-at-rest VM disk. The network allows public HTTP/HTTPS for Caddy. Database and private-file ports are not opened.
- Bootstrap installs Docker, checks out the configured public repository ref, and creates the self-host env file with random database passwords on the VM. Password values are not Terraform inputs or cloud-init values; the file is mode `0600` on the VM.
- The stack is not started by cloud-init. First point the chosen domain at the Terraform output IP, then use the provider's operator-access method and run `sudo bash /opt/rafik/infrastructure/scripts/deploy.sh`. This avoids TLS issuance before DNS is ready.
- The examples do not create DNS records, managed certificates, a managed database, object storage, or backup schedules. Use the paired database/private-file backup script and copy encrypted backups to university-controlled off-host storage. A disk snapshot alone is not the documented consistent backup procedure.
- Terraform's local state is plaintext by default. Store it on encrypted, access-controlled storage or configure a provider-supported encrypted remote backend; do not commit state, plan files or credentials. The examples do not configure remote state or grant broad cloud IAM roles.
- For an upgrade, take the paired database/private-file backup first. On the VM run `cd /opt/rafik && git fetch --tags && git checkout vX.Y.Z && sudo bash infrastructure/scripts/deploy.sh`, replacing `vX.Y.Z` with the reviewed release tag. To restore, start the matching Compose revision, apply its documented migration, then run `sudo bash /opt/rafik/infrastructure/scripts/restore.sh /opt/rafik/infrastructure/.env.selfhost /path/to/backup-directory`. Restore replaces both database and private files. A single disk snapshot is not a substitute for this pair.
- `terraform destroy` deletes the VM and its attached data disk. Take and verify an off-host backup first. Destroying the VM is not a data-retention procedure.

## Current verification status

These templates are Stage 6 starter infrastructure. They have not been applied to cloud accounts, and no provider deployment, cost estimate, upgrade, restore, or teardown is claimed as verified. Each university must review its cloud IAM policy, privacy requirements, regional availability, costs and disaster-recovery plan before use.
