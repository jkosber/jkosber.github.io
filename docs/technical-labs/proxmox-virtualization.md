---
title: Proxmox homelab
description: A repurposed laptop running Proxmox, Linux virtual machines, Docker services and an experimental network with managed addressing and firewall rules.
kind: Personal homelab
status: Ongoing
visual: assets/lab.svg
---

# Proxmox homelab

I built JHomelab on an old Alienware laptop so I could work with a real hypervisor, run Linux services and experiment with networking outside my everyday computer. The project brought together the Linux, virtualization and networking work I had been doing in class.

I installed Proxmox VE, created the guest machines, set up the lab network and added a Docker service host. The repository records the build, its hardware and guest inventory, configuration notes and the changes I want to make next.

<figure class="case-visual">
  <img src="../../assets/lab.svg" width="600" height="340" alt="A virtualization host connected to guest machines." loading="lazy">
  <figcaption>Conceptual view of the Proxmox host and its guests.</figcaption>
</figure>

## Host and storage

The documented build uses an **Alienware 15 R3** with an Intel i7-7700HQ and 16 GB of RAM. Proxmox runs directly on the laptop. I use separate drives for the host installation and guest storage.

| Component | Use in the lab |
|---|---|
| Intel i7-7700HQ, four cores and eight threads | Compute shared by the virtual machines |
| 16 GB RAM | Physical memory available to the host and running guests |
| 120 GB SSD | Proxmox installation, local storage and installation images |
| 1 TB hard drive | Storage for virtual-machine disks |

The guest inventory assigns more memory in total than the laptop physically has. In the recorded startup configuration, only the Ubuntu service guest starts automatically; the other guests are reserved for individual lab sessions. The inventory lists configured machines, rather than a workload intended to run all at once.

## Linux guests and container services

The lab includes Ubuntu Server and Desktop, Kali, Fedora, openSUSE, Manjaro, Linux Mint, Zorin OS and Pop!_OS guests. Keeping separate guests gives me somewhere to try different Linux environments without changing my daily computer. An OPNsense guest is also listed as a gateway project in progress.

The Ubuntu Server guest hosts Docker, with Portainer used to manage the containers. The repository's service tier includes:

<div class="component-list" markdown>
- **Proxmox VE** manages the guest machines, storage and virtual networking.
- **Homepage** provides a central dashboard for the services.
- **Uptime Kuma** provides service-health monitoring.
- **Portainer** provides the container-management interface.
</div>

This separates the service host from the desktop and security-lab guests listed for experiments. The [guest and service inventory](https://github.com/jkosber/JHomelab#virtual-machines) records that arrangement.

## Network configuration

I used Proxmox software-defined networking to create an experimental virtual network alongside the main LAN connection. The lab network uses Proxmox IP address management and DHCP. I followed a consistent relationship between guest identifiers and addresses so I could relate the VM inventory to packet captures and firewall records.

At the datacenter level, I configured an allowlist for lab outbound traffic, DNS and DHCP, plus management access such as SSH and the Proxmox web interface. The [networking section](https://github.com/jkosber/JHomelab#sdn-and-ipam) records the addressing design and firewall configuration.

Per-guest and per-network firewall rules remain on the roadmap, along with a managed switch for VLAN work.

## GPU passthrough preparation

The laptop also has a GTX 1070 Mobile. The build notes record IOMMU configuration and binding that GPU to the `vfio-pci` driver for guest use. This is the host-side preparation for passthrough; hardware-accelerated media services are still listed as future work.

## What I have learned

Services and infrastructure setups have failed on me multiple times. Working through those failures is the part that teaches me the most. Having a lab means I can try a setup, see what breaks and figure out what needs to change.

## Next changes

The repository roadmap includes replacing the wireless bridge with a wired connection, adding managed switching, and working on reverse proxying, internal DNS and shared storage. Those are planned additions, not services I am presenting as already deployed.

The guest inventory reflects the build documented in the repository. Current guest and service status has not been rechecked.

[View the JHomelab repository](https://github.com/jkosber/JHomelab) for the build notes, inventory and changelog. The [AdventureWorks project](aws-linux-infrastructure.md) covers my separate AWS coursework.
