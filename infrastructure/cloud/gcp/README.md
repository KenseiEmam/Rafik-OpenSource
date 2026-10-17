# Google Cloud starter

Creates one Ubuntu 24.04 Compute Engine VM (`e2-medium` by default), a dedicated VPC/subnet, static external IP, 50 GiB balanced encrypted boot disk and a VM service account with no project roles. Only HTTP/HTTPS are public. SSH is allowed only through IAP's documented source range; OS Login is enabled and project SSH keys are blocked. An operator still needs the appropriate OS Login and IAP tunnel IAM permissions, plus Compute Engine and IAP APIs enabled in the existing project.

From this directory, authenticate with `gcloud auth application-default login`, copy `terraform.tfvars.example` to `terraform.tfvars`, set the project/domain/email, then run `terraform init`, `terraform plan` and `terraform apply`. Point the domain's DNS A record at `public_ip`. Connect using the output `iap_ssh_command`; after DNS resolves, run `sudo bash /opt/rafik/infrastructure/scripts/deploy.sh`. To remove resources, back up and verify off-host data first, then run `terraform destroy`.

Terraform uses Google provider 8.x. State contains infrastructure identifiers and must be stored privately with encryption and access control. This template does not assign user IAM roles or configure managed database, object storage, backups, DNS or monitoring. Verify charges and regional availability with Google Cloud's calculator before applying. Cloud apply, upgrade, restore and teardown have not been verified for this template.

References: [Compute Engine instance resource](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/compute_instance), [OS Login](https://docs.cloud.google.com/compute/docs/instances/access-overview), [SSH through IAP](https://docs.cloud.google.com/compute/docs/connect/ssh-using-iap).
