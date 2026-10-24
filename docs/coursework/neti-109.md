---
title: NETI 109 Networking I
description: "Cisco Networking Academy labs in Packet Tracer: addressing and VLSM, device setup, and troubleshooting client and gateway faults."
kind: Coursework class
code: NETI 109
course: Networking I
term: Fall 2025
items: 36 lab write-ups
repo: https://github.com/jkosber/Networking-109
art: {src: assets/thumbnails/network.svg, width: 240, height: 160}
summary:
  role: "I worked the Packet Tracer activities and labs and wrote up each one: addressing tables, subnet plans, and what was wrong on each device and how I fixed it."
  built_with: ["Cisco Packet Tracer", "Cisco IOS", "Wireshark"]
  result: "36 lab write-ups, from fixed-length subnetting to a full VLSM design, and two troubleshooting labs where I traced client faults to addresses, gateways, a router interface and DNS. I completed Cisco's Networking Basics and Introduction to Networks courses."
---

# NETI 109 Networking I

Networking I was the first course in Cisco's CCNA sequence: how devices address and find each other, how to set up switches and routers, and how to troubleshoot when a client can't reach something. I did the labs in Packet Tracer and turned in a write-up for each one.

## What the course provided and what I did {#what-the-course-provided}

The course provided the Cisco Networking Academy activities and lab sheets: the topologies, addressing tables, steps and sample output, and the starting device configurations. My part was working each activity and writing up the results:

- Filled in the addressing tables and subnet plans myself, including two VLSM designs
- Wrote what was wrong on each device in the troubleshooting labs and what I changed to fix it
- Answered the lab questions on IOS, switching, ARP, IPv6 and TCP and UDP from what I saw in Packet Tracer's simulation mode
- Ran my own Wireshark captures for the Ethernet and ICMP labs

The device configurations are inside the Packet Tracer files, which GitHub can't display. This page is built from my written answers.

## Labs {#labs}

### Getting started, IOS and the physical layer

| Lab | What it asked | What I did |
|---|---|---|
| 1.0.5 Logical and Physical Mode Exploration | Tour Packet Tracer's physical mode and add a backup router | Answered the device and rack questions |
| 1.5.5 Network Representation | Name device types and explain clients, servers, LANs and WANs | Counted 15 end devices and 11 intermediary devices and explained LAN and WAN |
| 1.9.3 Research IT and Networking Job Opportunities | Look up networking jobs and the certifications they ask for | Compared network administrator and engineer postings and their certifications |
| 2.3.7 Navigate the IOS | Move between IOS modes and use help | Wrote down how the prompt changes in each mode and what the error messages mean |
| 2.5.5 Configure Initial Switch Settings | Set a hostname, passwords, a banner and save the config | Explained why `login` is needed and why the secret shows as a hash, then saved to NVRAM |
| 2.7.6 Implement Basic Connectivity | Address two PCs and give two switches a management address | Explained why a switch needs an IP address and what `no shutdown` does |
| 3.4.4 Research Networking Standards | Find what the IETF, IEEE, ITU and W3C each do | Answered 23 questions and wrote why shared standards matter |
| 3.5.5 Investigate the TCP/IP and OSI Models in Action | Follow a web request layer by layer in simulation mode | Listed the ports and the layer 2, 3, 4 and 7 fields at each step |
| 3.7.10 Use Wireshark to View Network Traffic | Capture pings to a local host and to remote sites | Found that local pings carry the peer's MAC and remote pings carry the gateway's |
| 4.6.5 Connect a Wired and Wireless LAN | Pick the right cables and connect a small network | Answered the media and physical-view questions |
| 4.7.1 Physical Layer Exploration | Trace a path from a home to a server across ISPs and an undersea cable | Read the hop interfaces and cable landing points off the map |
| 4.7.2 Connect the Physical Layer | Identify router ports and modules and cable a network | Identified the management ports, interface bandwidths and the added switch module |

### Switching and address resolution

| Lab | What it asked | What I did |
|---|---|---|
| 7.1.6 Use Wireshark to Examine Ethernet Frames | Read Ethernet II fields in a sample capture and in my own | Explained the frame type, the preamble and which MAC a remote ping uses |
| 7.2.7 View Network Device MAC Addresses | Read MAC addresses with `show interfaces`, `show arp` and the MAC table | Found the switch and PC MACs in my own run and explained what the broadcast MAC is for |
| 7.3.7 View the Switch MAC Address Table | Clear the MAC table and watch it fill again | Watched four devices get relearned and wrote how ARP and MAC tables can be spoofed |
| 9.1.3 Identify MAC and IP Addresses | Note the addresses at each hop in simulation | Filled four PDU tables and explained why the router rewrites MAC addresses |
| 9.2.9 Examine the ARP Table | Watch ARP requests and replies, including to a remote host | Found that ARP for an off-subnet host asks for the gateway's address |
| 9.3.4 IPv6 Neighbor Discovery | Follow Neighbor Discovery on a local and a remote network | Identified the ICMPv6 types and the solicited-node multicast addresses |

### Routers and addressing

| Lab | What it asked | What I did |
|---|---|---|
| 10.1.4 Configure Initial Router Settings | Set up a router and look at flash | Identified the IOS image in flash and why `enable secret` overrides `enable password` |
| 10.3.4 Connect a Router to a LAN | Configure interfaces and read the routing table | Counted connected and OSPF routes and explained what happens to unlisted destinations |
| 10.3.5 Troubleshoot Default Gateway Issues | Find and fix four addressing faults | Found and fixed all four (see below) |
| 10.4.3 Basic Device Configuration | Configure one of three topology versions | Did the work in Packet Tracer; the write-up only notes which version I had |
| 11.5.5 Subnet an IPv4 Network | Split a /24 for 50 and 40 hosts and address the devices | Worked out four /26 subnets and filled the addressing table |
| 11.6.6 Calculate IPv4 Subnets | Six subnet calculations | Got all 48 values right |
| 11.7.5 Subnetting Scenario | Split a /24 into /27s for five networks | Filled the subnet and addressing tables |
| 11.9.3 VLSM Design and Implementation Practice | VLSM for four LANs and a router link | Picked the masks and built the subnet and addressing tables |
| 11.10.1 Design and Implement a VLSM Addressing Scheme | VLSM for four LANs and a router link, largest first | Designed the plan and the device addressing (see below) |
| 12.4.5 Basic Device Configuration | Configure IPv4 and IPv6 on a router, switch and hosts | Filled the dual-stack addressing table |
| 12.7.4 Identify IPv6 Addresses | Classify, shorten and expand IPv6 addresses | Matched all eight addresses to their types and wrote the short forms |
| 12.9.1 Implement a Subnetted IPv6 Addressing Scheme | Subnet an IPv6 /64 block and address two routers | Worked out the five subnets and the interface addresses |
| 13.2.6 Verify IPv4 and IPv6 Addressing | Check a dual-stack network with ping and traceroute | Checked every ping and mapped each traceroute hop to its interface |

### Transport, applications, security and a small network

| Lab | What it asked | What I did |
|---|---|---|
| 14.8.1 TCP and UDP Communications | Compare HTTP, FTP, DNS and email at layer 4 in simulation | Compared the ports, sequence numbers and flags for each and explained why DNS used UDP |
| 15.4.8 Observe DNS Resolution | Look up A, PTR and MX records | Explained why browsing by IP can fail for a CDN site and how MX preference works |
| 16.2.6 Research Network Security Threats | Use SANS and CISA to research a current attack | Wrote up a SYN flood case and how to defend against it |
| 17.5.9 Interpret show Command Output | Match `show` commands to questions about a router | Answered which command shows the IOS version, flash, users, routes and interfaces |
| 17.7.6 Troubleshoot Connectivity Issues | Find why four clients can't reach a web server | Traced each fault and flagged the one I wasn't allowed to fix (see below) |

## Strongest work {#strongest-work}

### Designing a VLSM plan (11.10.1) {#addressing-a-small-network}

The lab gave me two routers, four LANs that needed 32, 21, 19 and 8 host addresses, and a link between the routers. The plan had to be contiguous, largest subnet first, with the smallest possible subnet on the router link.

I gave the largest LAN a /26, the next two a /27 each, the smallest a /28 and the router link a /30. A /27 only has 30 usable addresses, so it couldn't fit 32 hosts. Here's the plan moved onto the documentation range `192.0.2.0/24`, with the same sizes and order as my submission:

| Segment | Hosts needed | Subnet | Usable range | Broadcast |
|---|---:|---|---|---|
| Largest LAN | 32 | `192.0.2.0/26` | `.1`–`.62` | `.63` |
| Second LAN | 21 | `192.0.2.64/27` | `.65`–`.94` | `.95` |
| Third LAN | 19 | `192.0.2.96/27` | `.97`–`.126` | `.127` |
| Smallest LAN | 8 | `192.0.2.128/28` | `.129`–`.142` | `.143` |
| Router link | 2 | `192.0.2.144/30` | `.145`–`.146` | `.147` |

In each LAN the router took the first usable address, the switch the second and the client the last, so the plan doubled as the device addressing table.

One mistake I'd fix: I gave the largest LAN's client the address ending in `.63`. That's the /26's broadcast address, which my own subnet table lists correctly. The client should have been `.62`.

### Troubleshooting a web server outage (17.7.6) {#troubleshooting-access-to-a-web-server}

Four clients couldn't reach a web server after a second DNS server was added. I could change the clients and the local router, but not the ISP cloud or the servers. I checked each client's settings in Packet Tracer's command prompt against the addressing table, then used ping and the browser to narrow it down:

- **PC-01** had the wrong IP address. After I corrected it, it reached the gateway, the web server and PC-02.
- **PC-02** had the wrong default gateway. Fixing it brought back web access.
- **PC-A** could ping its neighbor but not its gateway or anything beyond it, which pointed at the router. R1's G0/1 address was wrong, and correcting it let the two LANs reach each other.
- **PC-B** could reach the server by IP but not by name. I corrected its DNS setting and noted that DNS2 itself still had a problem the server's owner would need to fix.

As I wrote in the lab: "PC-A can only access the local lan and not other networks so I corrected the G0/1 interface ip address."

### Fixing default gateway faults (10.3.5)

Two LANs sat behind one router with four faults planted in them. I filled in the missing gateways in the addressing table, then found each problem from what could and couldn't ping:

- PC1 couldn't reach PC2 because its address didn't match the network it was wired to. I gave it the right address.
- Nothing could ping S2 because S2 had no IP address. I configured one with `ip address`.
- PC4 couldn't be reached because its default gateway was wrong. I set the correct gateway.
- Remote hosts couldn't ping S1 because it had no default gateway. I set it with `ip default-gateway`.

The lab sheet's own test table at the end was left mostly blank, so there's no written retest.

### Following IPv6 Neighbor Discovery (9.3.4)

In simulation mode I watched a PC find another PC's MAC address with Neighbor Discovery instead of ARP. I wrote down the ICMPv6 message types (128 and 129), the solicited-node multicast destination and its matching Ethernet address, and why a second ping needed no discovery at all. For a host on another network, the PC used the router's MAC instead. In my words: "A multicast address is used so only selected addresses would be listening to an ND message unlike a broadcast."

## Skills {#skills}

- IPv4 subnetting and VLSM design (11.5.5, 11.6.6, 11.7.5, 11.9.3, 11.10.1)
- Troubleshooting by narrowing down what can and can't be reached (10.3.5, 17.7.6)
- Cisco IOS basics: modes, passwords, banners, saving configs and `show` commands (2.3.7, 2.5.5, 10.1.4, 17.5.9)
- Switching, MAC tables and ARP (7.2.7, 7.3.7, 9.1.3, 9.2.9)
- IPv6 addressing and Neighbor Discovery (9.3.4, 12.7.4, 12.9.1, 13.2.6)
- TCP and UDP behavior, ports and DNS (14.8.1, 15.4.8)
- Packet captures in Wireshark (3.7.10, 7.1.6)

## Limits {#limits}

- The device configurations live in the Packet Tracer files, which I haven't reproduced here. Several activities are Packet Tracer files only, with no write-up.
- All the device configuration was done in Packet Tracer, not on real equipment.
- A few answers have mistakes: the broadcast address above, a mask written as `244` instead of 224 in 11.7.5, and a "first usable" column filled with last usable addresses in 11.9.3.
- My Wireshark and DNS answers came from my home network, so I haven't reproduced their addresses here.

## Sources {#sources}

- [NETI 109 repository](https://github.com/jkosber/Networking-109), with a write-up for every lab above
- [11.10.1 VLSM design write-up](https://github.com/jkosber/Networking-109/blob/main/Module-11-IPv4Addressing/11.10.1%20Packet%20Tracer%20-%20Design%20and%20Implement%20a%20VLSM%20Addressing%20Scheme.Jadon.Kosberg.docx) and [Packet Tracer file](https://github.com/jkosber/Networking-109/blob/main/Module-11-IPv4Addressing/11.10.1%20Packet%20Tracer%20-%20Design%20and%20Implement%20a%20VLSM%20Addressing%20Scheme.Jadon.Kosberg.pka)
- [17.7.6 troubleshooting write-up](https://github.com/jkosber/Networking-109/blob/main/Module-17-BuildASmallNetwork/17.7.6%20Packet%20Tracer%20-%20Troubleshoot%20Connectivity%20Issues.Jadon.Kosberg.docx)
- [10.3.5 default gateway write-up](https://github.com/jkosber/Networking-109/blob/main/Module-10-BasicRouterConfiguration/10.3.5%20Packet%20Tracer%20-%20Troubleshoot%20Default%20Gateway%20Issues.Jadon.Kosberg.docx)
- [9.3.4 Neighbor Discovery write-up](https://github.com/jkosber/Networking-109/blob/main/Module-09-AddressResolution/9.3.4%20Packet%20Tracer%20-%20IPv6%20Neighbor%20Discovery.Jadon.Kosberg.docx)

[All coursework](index.md) · [CSIA 210 Network Protocol Analysis](csia-210.md) · [CSIA 115 Cyber Ops](csia-115.md)
