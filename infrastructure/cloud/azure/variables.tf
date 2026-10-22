variable "location" {
  type    = string
  default = "East US"
}
variable "name" {
  type    = string
  default = "rafik"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.name))
    error_message = "Use 2-21 lowercase letters, numbers or hyphens beginning with a letter."
  }
}
variable "instance_id" {
  type    = string
  default = "rafik-university"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,30}$", var.instance_id))
    error_message = "Use lowercase letters, numbers or hyphens."
  }
}
variable "app_domain" {
  type = string
  validation {
    condition     = can(regex("^[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$", var.app_domain))
    error_message = "Set the public DNS name for the instance."
  }
}
variable "acme_email" {
  type = string
  validation {
    condition     = can(regex("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", var.acme_email))
    error_message = "Set an email for ACME certificate registration."
  }
}
variable "repository_url" {
  type    = string
  default = "https://github.com/Rafik-Athlete-Managment/Rafik-OpenSource.git"
  validation {
    condition     = can(regex("^https://github\\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\\.git$", var.repository_url))
    error_message = "Use a public GitHub HTTPS clone URL in owner/repository.git form."
  }
}
variable "git_ref" {
  type    = string
  default = "codex/university-revamp-plan"
  validation {
    condition     = can(regex("^[A-Za-z0-9_./-]+$", var.git_ref)) && !strcontains(var.git_ref, "..")
    error_message = "Use a plain Git branch or tag name."
  }
}
variable "vm_size" {
  type        = string
  default     = "Standard_B2s"
  description = "Small starter size; check availability and cost in the selected region."
}
variable "disk_size_gib" {
  type    = number
  default = 64
  validation {
    condition     = var.disk_size_gib >= 64
    error_message = "Use at least 64 GiB."
  }
}
variable "admin_username" {
  type    = string
  default = "rafikops"
}
variable "admin_ssh_public_key" {
  type        = string
  description = "Public half of an operator SSH key; the private key is never stored in Terraform."
}
variable "ssh_source_cidr" {
  type        = string
  default     = ""
  description = "Optional single operator CIDR for SSH, e.g. 203.0.113.4/32. Leave empty and use Azure Run Command by default."
}
