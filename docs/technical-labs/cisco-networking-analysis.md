---
title: Networking & packet analysis
description: Planned IPv4 subnets, diagnosed client, gateway and DNS faults in Packet Tracer, and traced an IPv6 gateway loss to Router Advertisements in supplied traffic.
kind: Completed coursework
status: Coursework 2025–2026
visual: assets/project-network.svg
---

# Networking & packet analysis

My networking coursework covered the configuration behind a working connection and the evidence needed when it fails. In **NETI 109**, I planned IPv4 subnets and diagnosed several different faults in a supplied Cisco Packet Tracer network. In **CSIA 210: Network Protocol Analysis**, I used Wireshark to connect host configuration with DHCPv6 and neighbor-discovery traffic.

The selected work includes a VLSM address plan, client-by-client connectivity tests and a [deeper IPv6 investigation](ipv6-packet-investigations.md) connecting packet fields to host behavior.

<div class="evidence-note" markdown>
**Historical coursework:** addressing and connectivity submissions from November–December 2025; protocol-analysis screenshots from May 12, 2026. The course supplied the scenarios and traces. My work was completing the tables, configuration exercises, packet analysis and written findings. The results below have not been retested for this page.
</div>

## Addressing a small network

The VLSM exercise supplied two routers, four LANs and a point-to-point connection between the routers. The LANs needed 32, 21, 19 and 8 host addresses. The assignment required contiguous allocation, largest first, with an efficient subnet for the two-address WAN link.

I assigned a /26 to the largest LAN, two /27s to the next LANs, a /28 to the smallest and a /30 to the WAN link. A /27 has only 30 usable host addresses, so it could not satisfy the 32-host requirement. Using a /26 everywhere would have allocated more addresses than the smaller LANs needed.

The following table rebases the submitted design onto the documentation-only range `192.0.2.0/24`. It preserves the original sizes and allocation order; these are example addresses, not the original lab network.

| Segment | Hosts required | Example subnet | Usable host range | Broadcast |
|---|---:|---|---|---|
| Largest LAN | 32 | `192.0.2.0/26` | `.1`–`.62` | `.63` |
| Second LAN | 21 | `192.0.2.64/27` | `.65`–`.94` | `.95` |
| Third LAN | 19 | `192.0.2.96/27` | `.97`–`.126` | `.127` |
| Smallest LAN | 8 | `192.0.2.128/28` | `.129`–`.142` | `.143` |
| Router link | 2 | `192.0.2.144/30` | `.145`–`.146` | `.147` |

The endpoint convention put the router at the first usable LAN address, the switch's VLAN 1 management interface at the second, and the client at the last usable address. For the router link, the two interfaces occupied its two usable addresses. This made the subnet plan directly usable as a device-addressing table.

### Reviewing the plan against the device table

The subnet boundaries in the submitted plan are consistent, but the largest-LAN client entry contains an error: it uses the address ending in `.63`, which the same submission correctly identifies as that /26's broadcast address. The last usable host address ends in `.62`.

A Packet Tracer activity file is retained, but the document contains no final ping matrix or completion screenshot resolving that client-address error. The original coursework remains unchanged.

The [VLSM submission and device table](https://github.com/jkosber/Networking-109/blob/main/Module-11-IPv4Addressing/11.10.1%20Packet%20Tracer%20-%20Design%20and%20Implement%20a%20VLSM%20Addressing%20Scheme.Jadon.Kosberg.docx) and [associated Packet Tracer activity](https://github.com/jkosber/Networking-109/blob/main/Module-11-IPv4Addressing/11.10.1%20Packet%20Tracer%20-%20Design%20and%20Implement%20a%20VLSM%20Addressing%20Scheme.Jadon.Kosberg.pka) retain both parts of that record.

## Troubleshooting access to a web server

A separate scenario started with four clients unable to access a web server after a network upgrade that added a second DNS server. Two client LANs connected through R1 and an upstream router to the web and DNS services. I could change the client and local router configuration, but the cloud and server devices were outside the permitted troubleshooting scope.

I checked the clients with `ipconfig`, compared their settings with the supplied addressing table, then used ping to separate local, gateway and remote reachability. Browser tests by hostname and by IP address added a name-resolution check to the path tests.

<div class="narrative-list" markdown>

PC-01
: **Recorded evidence.** Incorrect address; after correction, gateway, web server and PC-02 responded. The other LAN's clients did not.
: **Change and result.** Corrected its address against the supplied table. Browser access by name and IP worked, while the second LAN still needed investigation.

PC-02
: **Recorded evidence.** Its default gateway was incorrect. The later tests reached the gateway, web server and local peer.
: **Change and result.** Corrected the gateway; the written answer records restored web access. Tests to the second LAN still failed at this stage.

PC-A
: **Recorded evidence.** Could ping local peer PC-B, but not its gateway, the web server or clients on the other LAN.
: **Change and result.** Corrected R1's G0/1 address. The answer records the interface fault; the later PC-B tests show cross-network reachability. A separate complete PC-A retest is not preserved.

PC-B
: **Recorded evidence.** Could ping every listed destination and browse to the server by IP, but browsing by name failed.
: **Change and result.** Corrected its DNS setting. The submission identifies DNS2 as an unresolved issue requiring the server owner's attention.

</div>

The PC-A tests narrowed the fault to the path out of its LAN: communicating with a local peer did not require the router interface that was misaddressed. PC-B's successful IP-based web access then separated the remaining DNS failure from a failure to reach the application server.

The written tests record the client and router changes above. A final all-client retest and completion score are missing; the worksheet's 100% target was an instruction. The exact DNS2 fault and its server-side resolution remain unknown.

[Connectivity troubleshooting submission](https://github.com/jkosber/Networking-109/blob/main/Module-17-BuildASmallNetwork/17.7.6%20Packet%20Tracer%20-%20Troubleshoot%20Connectivity%20Issues.Jadon.Kosberg.docx) contains the original per-client test sequence.

## Reading the traffic behind the configuration

The protocol-analysis final capstone moved from device settings to supplied traffic captures. I created display filters for DHCP, DHCPv6, DNS, HTTP, SNMP, Telnet and TFTP, then recorded a matching exchange's transport protocol, IP version and destination port.

One investigation matched a Windows host's IPv6 address to the DHCPv6 Reply in **frame 9306**. Its screenshot shows the assigned address option, UDP ports 547 → 546 and the address's preferred and valid lifetimes. Matching the address option connected the host setting to the packet that supplied it.

I also inspected SSH and HTTPS traffic. SSH banners and key-exchange information remained readable; the encrypted application content was unreadable in the inspected traffic.

## Investigating IPv6 failures

The final capstone followed three related problems: a duplicate address on two Windows hosts, changing source-address selection, and loss of an IPv6 default gateway while an address remained assigned.

The gateway case provides the clearest diagnostic sequence. My written packet references identify a Router Advertisement with a lifetime of zero, the disappearance of the IPv6 gateway, and a later advertisement restoring a 270-second lifetime. The supplied sequence then showed successful pings again. The address and the route needed separate checks.

[Read the IPv6 packet investigations](ipv6-packet-investigations.md) for the filters, frame references, historical results and corrections to the original explanations of DHCPv6 and SLAAC behavior.

## Related experience

These exercises are academic work. My separate professional networking experience includes static-IP printer setup and Meraki client and port checks during [retail conversions](../experience/verizon-conversions.md), plus cabling work at [Ladd Dental Group](../experience/ladd-dental.md).

[Networking coursework repository](https://github.com/jkosber/Networking-109) · [Protocol-analysis repository](https://github.com/jkosber/CSIA-210-Network-Protocol-Analysis) · [All projects](index.md)
