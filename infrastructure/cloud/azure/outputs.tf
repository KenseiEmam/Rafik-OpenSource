output "public_ip" { value = azurerm_public_ip.rafik.ip_address }
output "resource_group" { value = azurerm_resource_group.rafik.name }
output "vm_name" { value = azurerm_linux_virtual_machine.rafik.name }
output "run_command" { value = "az vm run-command invoke --resource-group ${azurerm_resource_group.rafik.name} --name ${azurerm_linux_virtual_machine.rafik.name} --command-id RunShellScript --scripts 'sudo bash /opt/rafik/infrastructure/scripts/deploy.sh'" }
