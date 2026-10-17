output "public_ip" {
  description = "Create an A record for app_domain pointing here before starting Caddy."
  value       = aws_eip.rafik.public_ip
}

output "instance_id" {
  description = "Use with AWS Systems Manager Session Manager to administer the VM."
  value       = aws_instance.rafik.id
}

output "connect_command" {
  description = "Requires AWS CLI and the Session Manager plugin, plus IAM permission for this instance."
  value       = "aws ssm start-session --target ${aws_instance.rafik.id} --region ${var.region}"
}
