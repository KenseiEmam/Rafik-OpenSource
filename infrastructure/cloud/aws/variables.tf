variable "region" {
  description = "AWS region in which to create the isolated instance."
  type        = string
  default     = "us-east-1"
}

variable "name" {
  description = "Short unique resource prefix."
  type        = string
  default     = "rafik"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,20}$", var.name))
    error_message = "Use 2-21 lowercase letters, numbers or hyphens, beginning with a letter."
  }
}

variable "instance_id" {
  description = "Lowercase Compose project and volume prefix."
  type        = string
  default     = "rafik-university"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,30}$", var.instance_id))
    error_message = "Use 2-31 lowercase letters, numbers or hyphens, beginning with a letter."
  }
}

variable "app_domain" {
  description = "Public DNS name that will point to the VM before the Compose stack is started."
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$", var.app_domain))
    error_message = "Set a DNS name with a dotted public suffix; localhost is not accepted for cloud deployment."
  }
}

variable "acme_email" {
  description = "Operator email used by Caddy's ACME certificate registration."
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$", var.acme_email))
    error_message = "Set a valid email address for certificate registration."
  }
}

variable "repository_url" {
  description = "Public GitHub clone URL for the Rafik source repository."
  type        = string
  default     = "https://github.com/Rafik-Athlete-Managment/Rafik-OpenSource.git"
  validation {
    condition     = can(regex("^https://github\\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\\.git$", var.repository_url))
    error_message = "Use a public GitHub HTTPS clone URL in owner/repository.git form."
  }
}

variable "git_ref" {
  description = "Branch or tag to prepare on the VM. Prefer an immutable release tag for production."
  type        = string
  default     = "codex/university-revamp-plan"
  validation {
    condition     = can(regex("^[A-Za-z0-9_./-]+$", var.git_ref)) && !strcontains(var.git_ref, "..") && !startswith(var.git_ref, "-")
    error_message = "Use a plain Git branch or tag name."
  }
}

variable "instance_type" {
  description = "Small starter size; monitor memory and resize for real usage."
  type        = string
  default     = "t3.medium"
}

variable "disk_size_gib" {
  description = "Encrypted gp3 root volume size in GiB; PostgreSQL and private files reside here."
  type        = number
  default     = 50
  validation {
    condition     = var.disk_size_gib >= 50
    error_message = "Use at least 50 GiB for the app, database, files and local backup workspace."
  }
}
