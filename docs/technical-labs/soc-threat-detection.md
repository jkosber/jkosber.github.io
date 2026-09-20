---
title: CyberOps & traffic investigation
description: A Pushdo investigation, Snort alert analysis, a tested lab firewall rule and file extraction from packet captures.
kind: Completed coursework
status: Complete
visual: assets/project-security.svg
---

# CyberOps & traffic investigation

In **CSIA 115: Cyber Ops**, I worked with network alerts, packet captures and Linux tools to investigate suspicious activity. The course included a Pushdo malware assessment in Security Onion, a Snort and firewall exercise in a simulated network, and file extraction with Wireshark.

These were completed academic labs using course-provided virtual machines and training data. My submissions include investigation notes, written findings and screenshots of the lab work.

<figure class="case-visual">
  <img src="../../assets/project-security.svg" width="600" height="340" alt="Conceptual illustration of inspecting traffic and log records." loading="lazy">
  <figcaption>Traffic, logs and investigation in CyberOps coursework.</figcaption>
</figure>

## Investigating a Pushdo infection

For the skills assessment, I investigated historical alerts in a Cisco-provided Security Onion VM. The starting point was a sequence involving an executable download, a suspicious DNS lookup and Trojan alerts. I used Sguil to establish the time window and identify the internal host and external systems involved.

I examined the associated traffic with Wireshark and NetworkMiner, then brought the findings together in an after-action report. The work covered:

- Identifying the affected Windows host, including its IP address, MAC address and network adapter vendor.
- Building a sequence of the DNS activity, downloads and subsequent alerts.
- Identifying three downloaded files: `gerv.gun`, `trow.exe` and `wp.exe`.
- Using the files' SHA-256 hashes from NetworkMiner to look up existing VirusTotal results and record their malware detections.
- Connecting the file findings with alerts for Pushdo check-in and command-and-control responses.

The timeline also records a public-IP lookup and an alert for possible Tor traffic.

My recommendations covered isolating the affected host, updating endpoint protection, blocking identified destinations, segmenting the network and providing user security training. Those were proposed response and prevention measures. The assessment work itself was investigation and reporting.

The [completed assessment report](https://github.com/jkosber/CyberOps-115/blob/main/Module08/SkillsExamReportTemplate%20-%20Jadon%20Kosberg.docx) contains the timeline, file hashes, alert references and recommendations.

## Testing an alert and a firewall rule

In a separate lab, I used a Mininet network inside the CyberOps workstation VM. I started Snort on the simulated router, monitored its alert log and downloaded a file from the lab's web server.

The download generated a Snort alert that included the source and destination addresses, ports and event time. My screenshots show the alert alongside the HTTP request and completed download. I also used `tcpdump` to save the traffic for later inspection.

The initial download attempts returned HTTP 404 errors. After correcting the requested filename, the server returned HTTP 200 and the file downloaded. That distinguished a bad request from a connection failure before I moved on to the firewall change.

I added an `iptables` DROP rule to the router's FORWARD chain, targeting TCP traffic to the lab server's listening port. After checking the rule listing, I repeated the download and recorded that it was blocked. The rule applied to traffic passing through the router, which is why it belonged in FORWARD rather than INPUT or OUTPUT.

The [Snort and firewall submission](https://github.com/jkosber/CyberOps-115/blob/main/Module07/26.1.7%20Lab%20-%20Snort%20and%20Firewall%20Rules%20-%20Jadon%20Kosberg.docx) includes the commands, screenshots and results. This was a test in the supplied lab environment using the existing Snort rule set.

## Recovering a file from captured traffic

For the PCAP extraction exercise, I opened a supplied HTTP-download capture in Wireshark and followed its TCP stream. I examined the mixture of readable strings and binary data, then used **Export Objects → HTTP** to recover the transferred file.

A file with the original name already existed in the VM, so I saved the recovered copy under a different name and verified it in the directory listing. My [extraction submission](https://github.com/jkosber/CyberOps-115/blob/main/Module07/27.2.10%20Lab%20-%20Extract%20an%20Executable%20from%20a%20PCAP%20-%20Jadon%20Kosberg.docx) includes that result and the stream view. The course capture used a renamed substitute executable for safety; this exercise was about reconstructing a transfer, not executing malware.

## Course repository

The [CyberOps repository](https://github.com/jkosber/CyberOps-115) also contains my work with Windows administration tools, Linux logs and permissions, Nmap, TCP and UDP analysis, HTTP and HTTPS, access control lists and incident handling. The investigations above show how I used several of those tools together to document what happened and support a specific conclusion.

[Course repository](https://github.com/jkosber/CyberOps-115) · [Networking and packet analysis](cisco-networking-analysis.md) · [Certifications](../credentials/index.md)
