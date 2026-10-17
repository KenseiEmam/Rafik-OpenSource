output "public_ip" { value = google_compute_address.rafik.address }
output "instance_name" { value = google_compute_instance.rafik.name }
output "iap_ssh_command" { value = "gcloud compute ssh ${google_compute_instance.rafik.name} --project ${var.project_id} --zone ${var.zone} --tunnel-through-iap" }
