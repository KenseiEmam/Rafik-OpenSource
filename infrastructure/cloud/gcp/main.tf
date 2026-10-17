terraform {
  required_version = ">= 1.8.0, < 2.0.0"
  required_providers {
    google = { source = "hashicorp/google", version = ">= 8.0, < 9.0" }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

resource "google_compute_network" "rafik" {
  name                    = "${var.name}-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "rafik" {
  name          = "${var.name}-subnet"
  ip_cidr_range = "10.43.1.0/24"
  region        = var.region
  network       = google_compute_network.rafik.id
}

resource "google_compute_firewall" "web" {
  name    = "${var.name}-web"
  network = google_compute_network.rafik.name
  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["${var.name}-web"]
}

resource "google_compute_firewall" "iap_ssh" {
  name    = "${var.name}-iap-ssh"
  network = google_compute_network.rafik.name
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["${var.name}-web"]
}

resource "google_compute_address" "rafik" {
  name         = "${var.name}-ip"
  region       = var.region
  address_type = "EXTERNAL"
}

resource "google_service_account" "rafik" {
  account_id   = "${var.name}-vm"
  display_name = "Rafik VM with no project roles"
}

resource "google_compute_instance" "rafik" {
  name                      = var.name
  machine_type              = var.machine_type
  zone                      = var.zone
  tags                      = ["${var.name}-web"]
  allow_stopping_for_update = true
  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
      size  = var.disk_size_gib
      type  = "pd-balanced"
    }
  }
  network_interface {
    subnetwork = google_compute_subnetwork.rafik.id
    access_config {
      nat_ip = google_compute_address.rafik.address
    }
  }
  service_account {
    email  = google_service_account.rafik.email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
  metadata = { enable-oslogin = "TRUE", block-project-ssh-keys = "TRUE" }
  metadata_startup_script = templatefile("${path.module}/../bootstrap/prepare-ubuntu.sh.tftpl", {
    repository_url = var.repository_url
    git_ref        = var.git_ref
    instance_id    = var.instance_id
    app_domain     = var.app_domain
    acme_email     = var.acme_email
  })
  shielded_instance_config {
    enable_secure_boot          = true
    enable_vtpm                 = true
    enable_integrity_monitoring = true
  }
  labels = { app = "rafik", managed_by = "terraform" }
}
