---
title: Proxmox homelab
description: I built and maintain a Proxmox homelab with Linux guests, Docker services, monitoring and an experimental virtual network.
kind: Personal homelab
status: Ongoing
tools: [Proxmox VE, Linux, Docker, SDN]
summary:
  role: "I built and run it: hypervisor install, storage, guest machines, virtual networking, firewall rules, the Docker service host, and the patching and monitoring that keep it current."
  built_with: ["Proxmox VE 9", "Ubuntu Server", "Debian LXC containers", "Docker (Homepage, Uptime Kuma, Beszel, Portainer, RustDesk Server)", "Proxmox SDN with dnsmasq", "a Caddy reverse-proxy pilot", "OPNsense in progress"]
  result: "Ten VMs and two containers on a 16 GB laptop, with two service guests that start on boot. In October I patched every host after a certificate authority compromise and set up monitoring that alerts me in Discord."
  source: {label: "JHomelab repository", url: "https://github.com/jkosber/JHomelab"}
updated: "October 23, 2026"
screenshot:
  src: assets/evidence/homelab/homepage-dashboard-2026-10-23.webp
  width: 1232
  height: 944
  alt: "Homepage dashboard on October 23. Proxmox shows 1 of 10 VMs and 1 of 2 containers running; Portainer shows 7 containers running and none stopped; the host, VM 109 and CT 110 are up; Beszel reports 3 of 3 systems up; Uptime Kuma shows 7 sites up, 0 down and 100% uptime. Link lists for documentation and repositories sit below the panels."
  caption: "My homelab dashboard, October 23, 2026"
---

# Proxmox homelab

I built JHomelab on an old Alienware laptop so I could work with a real hypervisor, run Linux services and experiment with networking outside my everyday computer. The project brought together the Linux, virtualization and networking work I had been doing in class.

Desktop and security-lab guests run only for individual sessions. The applications on the service host are existing software projects; my work is the infrastructure underneath them.

## How the lab fits together

<figure class="architecture">
  <ol class="architecture-flow">
    <li><strong>Physical connection</strong><span>Home router<br>Wireless bridge<br>Flat access network</span><small>Wired backhaul and VLAN switching planned</small></li>
    <li><strong>Proxmox host</strong><span>Alienware 15 R3<br>16 GB physical RAM<br>SSD, guest-storage HDD and an unused NVMe</span><small>Virtual machines and two LXC containers</small></li>
    <li><strong>Guest attachments</strong><span>vmbr0: Ubuntu service VM + Debian LXC<br>testnet: nine experimental VMs + Caddy pilot</span><small>Service migration to SDN planned</small></li>
  </ol>
  <figcaption>Arrangement as of October 23. The diagram shows physical connectivity and guest attachment; it does not represent a tested security boundary. Addresses are omitted.</figcaption>
</figure>

The home router provides the upstream connection. A range extender acts as the wireless bridge into the lab, with its SSID broadcast disabled. Proxmox runs directly on the laptop and provides storage, guest management and virtual networking. The physical access network remains flat; a managed switch and VLAN work are future additions.

## Host and storage

After the October 23 updates, the host runs **Proxmox VE 9.2.21** on kernel **7.0.14-25-pve**, on an **Alienware 15 R3**. The hardware places practical limits on how many guests can run together.

| Component | Use in the lab |
|---|---|
| Intel i7-7700HQ, four cores and eight threads | Compute shared by the virtual machines |
| 16 GB RAM | Physical memory available to the host and running guests |
| 128 GB SSD | Proxmox installation and the `local` / `local-lvm` pools. It's aging, so Beszel watches its SMART data |
| 1 TB hard drive | `vmdata` storage for guest disks today. It becomes the backup drive once the NVMe is in use |
| NVMe SSD left over from Windows | Hidden from Proxmox by the BIOS's Intel RST RAID mode. Planned home for the guest disks |

The inventory assigns about **47 GB to the VMs, plus 4 GB to the GoodMem container and 512 MB to the Caddy pilot**, using rounded values. That exceeds physical RAM on purpose: only VM 109 and CT 110 start with the host, and the other guests stay off until I'm working on them.

All three storage pools were active in the September check. Their recorded usage was 65.33% for `local`, 0.01% for `local-lvm` and 23.96% for `vmdata`.

## Linux guests and container services

The lab has **ten VMs and two LXC containers**. The experimental group includes Ubuntu Desktop, Kali, openSUSE, Fedora, Zorin OS, Manjaro, Linux Mint and Pop!_OS, plus OPNsense. Separate guests let me try different Linux environments without changing my daily computer. OPNsense is a single-NIC gateway project in progress, not the established boundary between the service and lab networks. CT 111, added in October, is a Caddy reverse-proxy pilot on the lab network with internal HTTPS; Homepage was its first backend.

The service tier is split between a full virtual machine and an unprivileged Linux container:

| Guest | Recorded allocation and placement | Responsibilities |
|---|---|---|
| VM 109 — Ubuntu Server 26.04.1 LTS | 2 GB RAM, 32 GB disk; `vmbr0` | Docker host for the core services, deployed as a Portainer stack. Watchtower pulls new images for most of them once a day. |
| CT 110 — Debian 13.7 | Unprivileged LXC; 2 cores, 4 GB RAM, 512 MiB swap, 24 GB disk; `vmbr0` | GoodMem server v1.0.331 with PostgreSQL 17.11 and pgvector. GoodMem runs in Docker inside this separate LXC guest. |

### Services on VM 109

VM 109 runs Docker Engine 29.1.3.

| Service | What it does |
|---|---|
| Homepage 2.7.0 | My dashboard, with live Proxmox, Portainer, Beszel and Uptime Kuma panels |
| Uptime Kuma 2.5.7 | Service checks, a status page on my LAN and Discord alerts |
| Beszel 0.21.1 | Host and container health, drive SMART data and pending package updates |
| Portainer 2.45.3 | Container management |
| RustDesk Server 1.1.16 | Self-hosted remote support |
| Watchtower (maintained fork) | Daily image updates for Homepage, Uptime Kuma, Beszel and RustDesk |

<figure class="evidence-figure">
  <div class="evidence-scroll" role="region" tabindex="0" aria-label="Historical Proxmox guest inventory; scroll horizontally if needed">
    <img src="../../assets/evidence/homelab/guest-inventory-2026-09-22.webp" width="1050" height="525" alt="September 22 Proxmox inventory showing VM 109 and LXC 110 running, nine experimental VMs stopped, and three storage pools available." loading="lazy">
  </div>
  <figcaption>Historical Proxmox inventory, September 22, 2026. Resource and uptime values describe that capture, which predates CT 111. The screenshot shows guest state; the accompanying health-check report records automatic startup settings. <a href="../../assets/evidence/homelab/guest-inventory-2026-09-22.webp">Open the full-size inventory</a>.</figcaption>
</figure>

## Network configuration

I used Proxmox software-defined networking to create an experimental virtual network alongside the main LAN connection. The recorded configuration has **zone `test` and VNet `testnet`**. They are different objects: the zone contains the VNet, and the lab guests attach to the VNet.

| Configuration | What the evidence shows |
|---|---|
| Experimental guests | VMs 100–108 attached to `testnet`, joined in October by the CT 111 pilot |
| Address management | Proxmox IPAM mappings for the gateway and VMs 100–108; dnsmasq present for DNS/DHCP |
| Egress configuration | A source-NAT rule present on the host |
| Service guests | VM 109 and CT 110 still attached to `vmbr0`; moving them onto SDN is planned |

IPAM mappings associate guest identifiers with assigned addresses. Each lab VM's address ends in its VMID, so I can match the Proxmox inventory against packet captures and firewall logs without looking anything up; CT 111 is the one exception for now. All nine lab VMs were stopped during the September check, so guest DHCP and outbound connectivity were not tested from inside them.

### Firewall policy and its limits

The datacenter firewall was enabled with seven accept rules covering lab traffic, DNS/DHCP and management access including ICMP, SSH and the Proxmox web interface. **Input defaulted to DROP; output and forwarding defaulted to ACCEPT**, so the policy allowed outbound and forwarded traffic by default.

<figure class="evidence-figure">
  <div class="evidence-scroll" role="region" tabindex="0" aria-label="Historical Proxmox firewall defaults; scroll horizontally if needed">
    <img src="../../assets/evidence/homelab/firewall-options-2026-09-22.png" width="900" height="240" alt="Proxmox firewall options with firewall enabled, input policy DROP, output policy ACCEPT and forward policy ACCEPT." loading="lazy">
  </div>
  <figcaption>Configured datacenter defaults captured September 22, 2026. No denied-traffic or isolation test accompanied this screenshot. <a href="../../assets/evidence/homelab/firewall-options-2026-09-22.png">Open the full-size firewall options</a>.</figcaption>
</figure>

The same check found three issues to resolve before expanding the network design:

- One rule's comment described internet access, while its destination was the home LAN.
- The nftables firewall was active, but legacy firewall status reported pending changes.
- Global IPv4 forwarding was `0`, while forwarding on `vmbr0` and `testnet` was `1`.

The effect of these settings on live lab traffic remains untested. Checking guest DHCP, permitted egress and denied traffic is the next step before relying on the intended policy. Per-guest and per-network rules, service-guest migration and managed switching remain planned work.

## Health check results {#recorded-validation}

The September 22 check is the baseline I compare against. It covered host health, the Proxmox interface and service responses:

| Check | Recorded result | What remained untested |
|---|---|---|
| Hypervisor | Core services active, no failed systemd units listed, web interface responded | Recovery or sustained availability |
| VM 109 endpoints | Homepage HTTP 200; Uptime Kuma HTTP 200 after redirect; Portainer HTTPS 200 | Individual application workflows and direct Docker inventory |
| GoodMem | Docker health check healthy; API reported `server-v1.0.285` | Complete client workflows and service recovery |
| PostgreSQL/pgvector | Container running with image `pgvector/pgvector:pg17` | Database integrity, backup restoration and separate reachability of every published port |
| Storage | Three pools active; HDD SMART passed with zero listed reallocated, uncorrectable or CRC-error counters | Recoverability of guest disks and the boot SSD's unresolved warning |

The HTTPS probes accepted local self-signed certificates, leaving certificate trust unverified.

The check couldn't see inside VM 109: its guest agent wasn't running and my SSH login was denied. Both gaps were fixed in October. SSH works, and VM 109 now runs `qemu-guest-agent`, so snapshots and backups freeze its filesystem first.

## October maintenance

Most of October went to patching and to finally being able to see what the lab is doing.

### A certificate authority compromise

On October 21 the eMudhra (emSign) certificate authority had a key compromise, and Node.js, Python and uv shipped fixes. I removed the `emSign ECC Root CA - G3` root from the system trust store on the Proxmox host and every guest. On CT 110 I took a snapshot, then updated ca-certificates, OpenSSL, Docker, GoodMem and PostgreSQL. On VM 109 I took a snapshot, updated Portainer and redeployed every stack. Some vendors take a while to ship patched images, so I added a small read-only script that checks each host and reports OK, WAIT, ACT or FAIL for every fix.

### Updates on every host

| Host | What I did on October 23 |
|---|---|
| Proxmox host | Removed leftover Proxmox 8 (bookworm) APT entries and a duplicate security list, installed the pending updates, and dropped an old kernel while keeping the running kernel and two fallbacks |
| VM 109 | Installed the available updates; Ubuntu's phased rollout still holds back systemd and containerd. Updated Portainer, Homepage and Uptime Kuma, installed `qemu-guest-agent`, and grew the root volume to the whole disk while the VM was running |
| CT 110 | Took a snapshot, installed every pending update, 33 of them security fixes, and rebooted so every service loaded the new libc and systemd. GoodMem answered again 26 seconds later |

Watchtower was its own problem. The original `containrrr/watchtower` project was archived in December 2025, and it only worked on Docker 29 because I had forced an older API version. I replaced it with the maintained fork using the same settings. The fork negotiates the Docker API on its own, so the override is gone. I took a snapshot or backup before each change and deleted them once everything checked out.

### Monitoring and alerts

Until October the only monitoring I had was an Uptime Kuma install I had never set up, and nothing watched the hardware. Now two tools split the job. Beszel has agents on the Proxmox host, VM 109 and CT 110 and tracks how the machines themselves are doing. Uptime Kuma checks the services from the outside every minute. Both post to a private Discord channel.

| Alert | From | Fires when |
|---|---|---|
| Machine down | Beszel | A host or guest stops reporting for 2 minutes |
| Resources | Beszel | CPU or memory stays above 90% for 10 minutes, or a disk passes 85% |
| Drive health | Beszel | A drive's SMART state gets worse |
| Services and containers | Beszel | A systemd service fails or a Docker health check goes unhealthy |
| Heat | Beszel | The laptop runs above 85 °C for 5 minutes |
| Service down | Uptime Kuma | Two failed checks in a row on Proxmox, GoodMem, Portainer, Beszel, RustDesk or this site |
| Certificate | Uptime Kuma | This site's TLS certificate is close to expiring |

Beszel also lists pending package updates for each machine and flags the security ones. The first time it ran, it showed 87 updates waiting on CT 110. That container had only been getting targeted fixes, and I hadn't noticed.

### Dashboard

Homepage was already on VM 109, but I had never configured it, so it was a page of links I didn't open. Before setting it up again I compared it with Homarr, Dashy, Glance, Homer, Heimdall and four Proxmox-specific tools. Homepage won because it can pull live data from all four tools I run, a lot of people use it, it releases often, and its current image is on a patched Node version. Homarr came close, but it can't show Portainer.

Each panel uses its own credential instead of my admin logins. The Proxmox panel uses an API token on a separate user that has only the `PVEAuditor` role, with privilege separation on; it can read everything, and a write attempt got a 403. Portainer has an access token made just for the dashboard, and Beszel has a separate superuser account, because Homepage's Beszel panel won't work with less. Homepage reads them from root-only files mounted read-only into the container, so none of them are in the dashboard config.

I didn't test Portainer actions or the Uptime Kuma interface beyond the monitors themselves.

## GPU passthrough preparation

The laptop has a GTX 1070 Mobile alongside its integrated graphics. The September check found the NVIDIA GPU bound to `vfio-pci` and assigned in the configurations for VMs 100, 105, 107 and 108. Those guests were stopped; VM 109 had no GPU assignment.

The build journal records IOMMU as verified, with the kernel parameters `intel_iommu=on iommu=pt pcie_acs_override=downstream`. Guest GPU operation and hardware-accelerated transcoding remain untested; these host settings are a record of preparation, not a verified passthrough procedure. Jellyfin with GPU transcoding remains a roadmap item.

## What I have learned

Services and infrastructure setups have failed on me multiple times. Working through those failures is the part that teaches me the most. Having a lab means I can try a setup, see what breaks and figure out what needs to change.

## Next changes

Storage comes first: switch the BIOS to AHCI, move the guest disks onto the NVMe and start scheduled backups to the 1 TB drive. The roadmap also includes an off-host alert for when the whole Proxmox host goes down, moving the Tailscale subnet router from VM 100 to the always-on VM 109, and validating the network policy with real guest traffic.

The broader build plan covers a Cat6 run to replace the wireless bridge, a managed switch with 802.1Q VLANs, extending SDN to the service guests, per-zone firewall rules, a reverse proxy for internal hostnames (I'm trying Caddy on CT 111 before Nginx Proxy Manager), internal DNS and a NAS. Wazuh or Security Onion for SIEM/IDS and Jellyfin with GPU transcoding are planned additions. The existing OPNsense guest remains a work in progress.

## Sources {#sources-and-artifacts}

- [Build journal and inventory, October 23 revision](https://github.com/jkosber/JHomelab/blob/b5a5608e6580e5420beb3672b65e67629953814a/README.md): host, storage, guests, services, monitoring, SDN configuration and roadmap.
- [October 2026 maintenance notes](https://github.com/jkosber/JHomelab/blob/b5a5608e6580e5420beb3672b65e67629953814a/docs/maintenance-2026-10-23.md): the certificate authority response, updates, monitoring, dashboard and the storage finding.
- [Read-only health-check report, September 22](https://github.com/jkosber/JHomelab/blob/b5a5608e6580e5420beb3672b65e67629953814a/docs/health-check-2026-09-22.md): recorded results, access limits, storage warnings and untested behavior.
- [Original guest-inventory capture](https://github.com/jkosber/JHomelab/blob/b5a5608e6580e5420beb3672b65e67629953814a/screenshots/guest-inventory-2026-09-22.webp) and [firewall-options capture](https://github.com/jkosber/JHomelab/blob/b5a5608e6580e5420beb3672b65e67629953814a/screenshots/firewall-options-2026-09-22.png): the historical images reproduced above.

The repository contains documentation and screenshots. Sanitized configuration exports, firewall rules and Compose files will go in once they stop changing every week.

[All projects](index.md) · [SSH Workbench](ssh-workbench.md) · [AdventureWorks on AWS](aws-linux-infrastructure.md)
