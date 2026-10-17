variable "project_id" {
  type        = string
  description = "Existing Google Cloud project with Compute Engine and IAP APIs enabled."
}
variable "region" {
  type    = string
  default = "us-central1"
}
variable "zone" {
  type    = string
  default = "us-central1-a"
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
  default = "https://github.com/KenseiEmam/Rafik-OpenSource.git"
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
variable "machine_type" {
  type        = string
  default     = "e2-medium"
  description = "2 vCPU / 4 GiB starter; increase for workload."
}
variable "disk_size_gib" {
  type    = number
  default = 50
  validation {
    condition     = var.disk_size_gib >= 50
    error_message = "Use at least 50 GiB."
  }
}
