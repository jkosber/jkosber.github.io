---
title: Proxmox homelab
description: A Proxmox lab for Linux guests, container services and network configuration.
kind: Personal homelab
status: Ongoing
visual: assets/lab.svg
---

# Proxmox homelab

I built this homelab to learn Linux, virtualization and networking by setting things up myself. It's an ongoing project where I can try services, troubleshoot problems and keep track of what changed.

## Components

<figure class="case-visual">
  <img src="../../assets/lab.svg" width="600" height="340" alt="A virtualization host connected to guest machines." loading="lazy">
  <figcaption>Conceptual view of a virtualization host and its guests.</figcaption>
</figure>

<div class="component-list" markdown>
- **Proxmox VE** manages virtual machines and storage.
- **Linux guests** host services and lab exercises.
- **Homepage, Uptime Kuma and Portainer** make up part of the container-service setup.
- **Virtual networking and firewall configuration** provide a place to work on addressing and access control.
</div>

## Health check

A read-only review on September 10, 2026, found the Proxmox services active and the management interface responding. Homepage, Uptime Kuma and Portainer also returned successful HTTP responses.

The same review found work still to do:

| Observation | What remained open |
| --- | --- |
| The boot SSD passed its overall SMART check but had error counters and repeated alerts. | Review disk health and backup readiness. |
| The guest-agent check timed out, and SSH verification was incomplete. | Check access inside the service guest. |
| No lab guest was running to test its network path. | Check DHCP, outbound access and isolation with a lab guest. |

These results describe that review. Application functionality, continuous uptime and the open items above have not been verified here.

## Lessons learned

I've had services and infrastructure setups fail multiple times. Working through those failures is how I learn best: try a setup, see what breaks, and figure out what to change.

## Project documentation

[The JHomelab repository](https://github.com/jkosber/JHomelab) contains configuration records and a historical guest inventory. The dated health review above comes from my project notes.

[AWS coursework](aws-linux-infrastructure.md) · [All projects](index.md)
