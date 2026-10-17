terraform {
  required_version = ">= 1.8.0, < 2.0.0"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = ">= 5.0, < 6.0" }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rafik" {
  name     = "${var.name}-rg"
  location = var.location
}

resource "azurerm_virtual_network" "rafik" {
  name                = "${var.name}-vnet"
  address_space       = ["10.44.0.0/16"]
  location            = azurerm_resource_group.rafik.location
  resource_group_name = azurerm_resource_group.rafik.name
}

resource "azurerm_subnet" "rafik" {
  name                 = "${var.name}-subnet"
  resource_group_name  = azurerm_resource_group.rafik.name
  virtual_network_name = azurerm_virtual_network.rafik.name
  address_prefixes     = ["10.44.1.0/24"]
}

resource "azurerm_public_ip" "rafik" {
  name                = "${var.name}-ip"
  location            = azurerm_resource_group.rafik.location
  resource_group_name = azurerm_resource_group.rafik.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_network_security_group" "rafik" {
  name                = "${var.name}-nsg"
  location            = azurerm_resource_group.rafik.location
  resource_group_name = azurerm_resource_group.rafik.name
  security_rule {
    name                       = "https"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "http"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
  dynamic "security_rule" {
    for_each = var.ssh_source_cidr == "" ? [] : [var.ssh_source_cidr]
    content {
      name                       = "ssh-restricted"
      priority                   = 120
      direction                  = "Inbound"
      access                     = "Allow"
      protocol                   = "Tcp"
      source_port_range          = "*"
      destination_port_range     = "22"
      source_address_prefix      = security_rule.value
      destination_address_prefix = "*"
    }
  }
}

resource "azurerm_network_interface" "rafik" {
  name                = "${var.name}-nic"
  location            = azurerm_resource_group.rafik.location
  resource_group_name = azurerm_resource_group.rafik.name
  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.rafik.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.rafik.id
  }
}

resource "azurerm_network_interface_security_group_association" "rafik" {
  network_interface_id      = azurerm_network_interface.rafik.id
  network_security_group_id = azurerm_network_security_group.rafik.id
}

resource "azurerm_linux_virtual_machine" "rafik" {
  name                            = var.name
  resource_group_name             = azurerm_resource_group.rafik.name
  location                        = azurerm_resource_group.rafik.location
  size                            = var.vm_size
  admin_username                  = var.admin_username
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.rafik.id]
  identity { type = "SystemAssigned" }
  admin_ssh_key {
    username   = var.admin_username
    public_key = var.admin_ssh_public_key
  }
  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
    disk_size_gb         = var.disk_size_gib
  }
  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-noble"
    sku       = "24_04-lts-gen2"
    version   = "latest"
  }
  custom_data = base64encode(templatefile("${path.module}/../bootstrap/prepare-ubuntu.sh.tftpl", {
    repository_url = var.repository_url
    git_ref        = var.git_ref
    instance_id    = var.instance_id
    app_domain     = var.app_domain
    acme_email     = var.acme_email
  }))
  boot_diagnostics {}
  tags = { application = "rafik", managed_by = "terraform" }
}
