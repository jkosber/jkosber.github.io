---
title: Networking & packet analysis
description: Subnet planning, Packet Tracer troubleshooting and Wireshark investigations of DHCPv6, address conflicts and lost gateways.
kind: Completed coursework
status: Complete
visual: assets/project-network.svg
---

# Networking & packet analysis

My networking coursework covered both configuring devices and investigating what happens when connectivity breaks. In **NETI 109**, I planned subnets and worked through Cisco Packet Tracer configuration and troubleshooting exercises. In **CSIA 210: Network Protocol Analysis**, I used Wireshark to examine protocol exchanges and explain problems shown in supplied traffic captures.

These are completed academic projects. The repositories contain my addressing tables, written answers, screenshots and selected Packet Tracer files.

<figure class="case-visual">
  <img src="../../assets/project-network.svg" width="600" height="340" alt="Conceptual illustration of network devices and packet analysis." loading="lazy">
  <figcaption>Network configuration and packet analysis coursework.</figcaption>
</figure>

## Addressing a small network

For the VLSM design exercise, I divided an assigned IPv4 network into subnets sized for four LANs and a link between two routers. VLSM, or variable-length subnet masking, lets each subnet use an address range that fits its host requirements.

| Requirement | Subnet selected | Usable host addresses |
|---|---|---|
| Largest LAN: 32 hosts | /26 | 62 |
| Two LANs: 21 and 19 hosts | /27 for each | 30 each |
| Smallest LAN: 8 hosts | /28 | 14 |
| Router-to-router link: 2 hosts | /30 | 2 |

I allocated the largest subnet first, then recorded each network, first usable address and broadcast address. I also completed an addressing table for the router interfaces, switch management interfaces and end devices. The [submitted VLSM worksheet](https://github.com/jkosber/Networking-109/blob/main/Module-11-IPv4Addressing/11.10.1%20Packet%20Tracer%20-%20Design%20and%20Implement%20a%20VLSM%20Addressing%20Scheme.Jadon.Kosberg.docx) shows the resulting plan.

## Troubleshooting access to a web server

Another Packet Tracer scenario involved several users who could not reach a web server after a network change. I checked each workstation's configuration with `ipconfig`, tested its gateway and other hosts with ping, and compared browser access by name with access by IP address.

The failures had different causes:

| Finding | Work recorded in my submission |
|---|---|
| Incorrect workstation address | Corrected the address against the supplied addressing table. |
| Incorrect default gateway | Changed the gateway; the workstation could then access the web server. |
| Access limited to the local LAN | Corrected the router interface address serving that LAN. |
| Website reachable by IP but not by name | Changed the workstation's DNS setting and identified the second DNS server as an issue requiring its owner's attention. |

The DNS case mattered because a successful connection to the server's IP address narrowed the problem: the network path was available, but name resolution was still failing. My [troubleshooting submission](https://github.com/jkosber/Networking-109/blob/main/Module-17-BuildASmallNetwork/17.7.6%20Packet%20Tracer%20-%20Troubleshoot%20Connectivity%20Issues.Jadon.Kosberg.docx) records the individual tests and the unresolved issue with that DNS server.

## Reading the traffic behind the configuration

In the protocol-analysis final capstone, I created display filters for DHCP, DHCPv6, DNS, HTTP, SNMP, Telnet and TFTP. For each application, I inspected a matching packet and recorded its transport protocol, IP version and destination port.

I then followed a DHCPv6 exchange more closely. I compared the Windows host's `ipconfig` output with DHCPv6 Reply packets and located the reply that supplied its address. This connected a setting visible on the host to the packet that delivered it.

I also inspected SSH and HTTPS traffic in Wireshark's packet-bytes view. The application content was encrypted, while connection setup still exposed information such as the SSH banner and negotiated algorithms. My work focused on what the capture actually made visible.

## Investigating IPv6 failures

The capstone's IPv6 cases required looking beyond whether a host had an address:

- **Duplicate address:** I traced neighbor discovery traffic involving two Windows hosts and compared it with the host output identifying a duplicate IPv6 address. IPv4 connectivity was still available in the dual-stack scenario.
- **Address changes:** I followed a Windows host as its available IPv6 addresses changed, comparing router advertisements with the host's public, temporary and DHCPv6-assigned addresses.
- **Missing default gateway:** I identified a router advertisement with a router lifetime of zero, followed by the host losing its IPv6 default gateway. A later advertisement restored a nonzero lifetime, and the supplied sequence showed connectivity returning.

That last case separated two conditions that can look similar from a user's perspective: a host can retain its IPv6 address and still lack a route to another network. The [final capstone submission](https://github.com/jkosber/CSIA-210-Network-Protocol-Analysis/blob/main/Module08/CSIA%20210%20Finals%20Capstone%20submission%20file%20-%20Jadon%20Kosberg.docx) contains my packet references, screenshots and explanations for these investigations.

## Related experience

My professional networking work includes static-IP printer setup and Meraki client and port checks during [retail conversions](../experience/verizon-conversions.md), plus cabling work at [Ladd Dental Group](../experience/ladd-dental.md).

[Networking repository](https://github.com/jkosber/Networking-109) · [Protocol analysis repository](https://github.com/jkosber/CSIA-210-Network-Protocol-Analysis) · [All projects](index.md)
