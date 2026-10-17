# AWS starter

Creates a dedicated VPC/subnet, Internet Gateway, security group, static Elastic IP and Ubuntu 24.04 EC2 instance (`t3.medium`, 50 GiB encrypted gp3 root disk by default). Inbound access is limited to HTTP/HTTPS; port 22 is closed. A minimal EC2 role enables Systems Manager Session Manager and has no application-data permissions.

From this directory, configure AWS credentials using the AWS CLI's normal role/profile or SSO flow, copy `terraform.tfvars.example` to `terraform.tfvars`, set the domain/email, then run `terraform init`, `terraform plan` and `terraform apply`. Point the DNS A record to `public_ip`. Connect using the `connect_command` output (AWS CLI and Session Manager plugin required), wait for bootstrap to finish, then run `sudo bash /opt/rafik/infrastructure/scripts/deploy.sh` after DNS resolves. To remove resources, first verify an off-host backup, then run `terraform destroy`.

Terraform uses AWS provider 6.x. State is sensitive and must remain private, encrypted and access-controlled. This template does not configure DNS, managed database, object storage, backup schedules or monitoring. Verify regional instance availability and charges with the AWS calculator. Cloud apply, upgrade, restore and teardown have not been verified for this template.

References: [EC2 instance resource](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/instance), [Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html).
