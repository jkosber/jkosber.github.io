---
title: CSIA 115 Cyber Ops
description: "Cisco CyberOps labs in Security Onion and the CyberOps Workstation: alert investigations, packet analysis, Snort and firewall rules."
kind: Coursework class
code: CSIA 115
course: Cyber Ops
term: Spring 2026
items: 47 labs and a skills assessment
repo: https://github.com/jkosber/CyberOps-115
art: {src: assets/thumbnails/security.svg, width: 240, height: 160}
summary:
  role: "Ran the Cisco labs in VirtualBox, worked each investigation from the alerts and captures, and wrote the answers and the final after-action report. The course provided the virtual machines, the captures and the alert data."
  built_with: ["Security Onion", "Sguil and Kibana", "Wireshark", "NetworkMiner", "VirusTotal", "Linux and Windows tools"]
  result: "Completed 47 labs and a skills assessment, ending with Security Onion investigations of an exploit kit infection, a compromised Windows host, a root shell traced across three tools, and a Pushdo infection written up as an after-action report."
---

# CSIA 115 Cyber Ops

Cyber Ops followed Cisco's CyberOps Associate course: how a security operations center works, the Windows and Linux internals an analyst reads, network traffic, attacks, cryptography and, at the end, investigating alerts in Security Onion. I ran the labs in VirtualBox and turned in answers and screenshots for each one.

## What the course provided and what I did {#what-the-course-provided}

The course provided the Cisco Networking Academy lab sheets, the CyberOps Workstation and Security Onion virtual machines, the Mininet and Packet Tracer topologies, and the captures and alert data for the investigations, several of them based on exercises from malware-traffic-analysis.net. My part:

- Ran every lab in VirtualBox on a personal computer and wrote original answers to its questions
- Worked the Security Onion investigations from alert to host to file with Sguil, Kibana, Wireshark, NetworkMiner and VirusTotal
- Wrote the after-action report for the final skills assessment

The Snort lab's detection rule and firewall command came with the lab; I ran them and read the results.

## Strongest work {#strongest-work}

### A Pushdo infection and its after-action report {#pushdo-after-action-report}

The final assessment provided Security Onion alerts from a 2017 Pushdo infection. I narrowed them in Sguil to a six-minute window, identified the infected Windows host and its network card's vendor in NetworkMiner, found the three files it downloaded in NetworkMiner's reconstructed objects and looked up their hashes on VirusTotal. The after-action report that followed recommended that the host be isolated, the three domains blocked, the network segmented and users trained. The assessment answer reads: "Pushdo is a downloader trojan so its true purpose is to download and install additional malicious contents."

The full write-up is on [Pushdo malware investigation in Security Onion](../technical-labs/soc-threat-detection.md).

### Rebuilding an exploit kit infection (27.2.15) {#rebuilding-an-exploit-kit-infection}

The data came from a January 2017 infection. I started in Kibana with the first alert, which tied the traffic to the RIG exploit kit, then moved to the Sguil and CapMe transcripts to rebuild what happened:

1. A search took the user to a compromised home-improvement site.
2. The site loaded a script from a redirector, which sent the browser to the exploit kit.
3. The exploit kit served a Flash exploit.
4. The later alerts named the payload as Cerber ransomware.

The whole exploit took less than a minute, from 22:54:42 to 22:55:28. From the saved page, the write-up explains how its script avoided detection: "The javascript file avoids detection by splitting the iframe tag." Hashing the downloaded Flash file and looking it up on VirusTotal showed 33 of 62 engines flagging it. A second alert under a different file name carried the same hash: "Yes the two hashes match even though the filenames are different indicating the same malware."

### Separating a misconfiguration from an attack (27.2.16) {#separating-a-misconfiguration-from-an-attack}

A Windows host's alerts spanned about three hours, but most fired within four minutes. The first one flagged a DNS update as coming from outside the network. I judged it a likely misconfiguration: "This IDS alert could have been a misconfiguration because the DNS request was a Dynamic DNS update from an internal host on the internal network."

The next alert was the attack. The host downloaded an executable that Cisco Talos recognized as a trojan by its hash. From there I identified encrypted traffic on port 2404 as the Remcos remote-access trojan checking in, and a second download, `F4.exe`, as a trojan downloader. In Kibana I sorted out the normal Windows traffic mixed in with it, such as the `ncsi.txt` connectivity check and a certificate revocation list.

### Snort and a firewall rule (26.1.7)

In a Mininet network, Snort ran on the router while a host requested a file from the lab's malicious server. The first two requests returned 404 because I had the file name wrong, and the corrected one returned 200. The lab's signature fired on all three, so the 200 and the finished transfer, not the alert, showed the file had come down. Then I inserted the lab's iptables rule to drop traffic to that server. My written retest says the download failed, but I didn't take a screenshot of it.

The full write-up is on [Snort, firewall rules & HTTP recovery](../technical-labs/snort-firewall-lab.md).

## Labs {#labs}

### Security operations and Windows

| Lab | What it asked | Work done |
|---|---|---|
| 1.0.6 Top Hacker Shows Us How It Is Done | Research one hack from a conference talk | Wrote up a key-fob jam-and-replay attack and how to defend against it |
| 1.1.5 Installing the Virtual Machines | Import the CyberOps Workstation VM | Imported and booted the VM and wrote the pros and cons of working in VMs |
| 1.2.3 Learning the Details of Attacks | Research an IoT vulnerability | Researched unencrypted IoT traffic and mitigations such as putting IoT devices on their own VLAN |
| 2.2.5 Becoming a Defender | Research certifications and security job postings | Compared CISSP, Security+ and GSEC and summarized what 26 job postings asked for |
| 3.0.3 Identify Running Processes | Identify processes with TCPView | Identified lsass, wininit, spoolsv and svchost and watched a browser's connections open and close |
| 3.2.11 Exploring Processes, Threads, Handles, and Windows Registry | Use Process Explorer and edit the registry | Traced a child process to its parent, checked a process on VirusTotal and changed a registry value to bring back a license prompt |
| 3.3.10 Create User Accounts | Create, promote and delete a local account | Created a local user, made it an administrator and deleted it |
| 3.3.11 Using Windows PowerShell | Compare cmd and PowerShell | Compared the two shells, matched a connection's process ID to its service and listed cmdlets an analyst would use |
| 3.3.12 Windows Task Manager | Processes, services and performance | Followed a process tree, ended a process and read the service and performance tabs |
| 3.3.13 Monitor and Manage System Resources in Windows | Services, Event Viewer and Performance Monitor | Started and stopped a service, found its events in Event Viewer and built a Performance Monitor data collector |

### Linux

| Lab | What it asked | Work done |
|---|---|---|
| 4.2.6 Working with Text Files in the CLI | Edit configuration files with SciTE and nano | Edited `.bashrc` and wrote an nginx server configuration, then started and stopped the server |
| 4.2.7 Getting Familiar with the Linux Shell | Basic shell commands | Worked through `man`, `mkdir`, `cd`, redirection, `ls`, `cp`, `mv` and `rm` |
| 4.3.4 Linux Servers | Find running servers with `ps` and `netstat` | Found nginx listening on port 80 and tested it with `telnet` |
| 4.4.4 Locating Log Files | Find and follow Linux logs | Read logs with `journalctl` and followed the nginx access log with `tail -f` while loading the page |
| 4.5.4 Navigating the Linux Filesystem and Permission Settings | Mounts, permissions and links | Mounted a disk, changed permissions with `chmod` and compared hard and symbolic links |

### Networks and Wireshark

| Lab | What it asked | Work done |
|---|---|---|
| 5.1.5 Tracing a Route | Use `ping` and `traceroute` | Compared terminal and web-based traceroute results and why they differ |
| 5.3.7 Introduction to Wireshark | Capture pings in Mininet | Captured pings between Mininet hosts and matched the MAC addresses to their interfaces |
| 7.2.8 Verify IPv4 and IPv6 Addressing | Check addressing with ping and tracert in Packet Tracer | Mapped each tracert hop to a router interface for IPv4 and IPv6 |
| 8.2.8 Using Wireshark to Examine Ethernet Frames | Read Ethernet II fields | Showed that a ping to a remote host carries the gateway's MAC as its destination |
| 9.2.6 Using Wireshark to Observe the TCP 3-Way Handshake | Observe SYN, SYN-ACK and ACK | Wrote down the flags, sequence and acknowledgment numbers of the three packets and read the capture back with `tcpdump` |
| 9.3.8 Exploring Nmap | Scan with Nmap | Scanned the VM itself and Nmap's test server and listed the open and filtered ports |
| 10.2.7 Using Wireshark to Examine a UDP DNS Capture | Read a DNS query and response | Read the ports and addresses in both and explained why DNS uses UDP |
| 10.4.3 Using Wireshark to Examine TCP and UDP Captures | Compare FTP over TCP with TFTP over UDP | Compared the two headers and explained why Wireshark marked the UDP checksum incorrect |
| 10.6.7 Using Wireshark to Examine HTTP and HTTPS Traffic | Compare HTTP and HTTPS | Recovered the lab's test login from the HTTP capture and showed the HTTPS data was unreadable |
| 12.1.9 Identify Packet Flow | Predict packet paths in Packet Tracer, then break a link | Predicted and watched the DNS and HTTP paths and how they changed after a link failed |
| 12.3.4 ACL Demonstration | Test an access list in Packet Tracer | Showed which pings the access list blocked, read it with `show access-lists`, removed it and retested |

### Threats, attacks and cryptography

| Lab | What it asked | Work done |
|---|---|---|
| 15.0.3 What's Going On | Count connections in TCPView | Counted the listening and established endpoints and watched a browser open its connections |
| 15.2.7 Logging Network Activity | Sniff FTP, read syslog and see NAT's effect in Packet Tracer | Read the FTP login in cleartext, recommended SFTP and explained why NAT hides which inside host replied |
| 17.1.7 Exploring DNS Traffic | Capture a DNS lookup | Flushed the cache, captured an `nslookup` and read the query and response fields |
| 17.2.6 Attacking a mySQL Database | Read a SQL injection in a capture | Followed the injection in the capture to the database version, the table names, and a password hash and its plaintext |
| 17.2.7 Reading Server Logs | Read logs with `cat`, `more`, `less`, `tail` and `journalctl` | Compared the tools and explained why log timestamps need synchronized clocks |
| 21.0.3 Creating Codes | Encrypt a message with an online tool | Encrypted and decrypted a message and saw a wrong key fail |
| 21.1.6 Hashing Things Out | Hash files and verify a download | Showed that an edit changes a file's hash and checked a download against its signature file |
| 21.2.10 Encrypting and Decrypting Data Using OpenSSL | Use AES-256 with OpenSSL | Encrypted and decrypted a file, using Base64 to make the output readable |
| 21.2.11 Encrypting and Decrypting Data Using a Hacker Tool | Crack zip passwords with fcrackzip | Timed cracks from under a second to about two minutes as passwords got longer and recommended at least 8 characters |
| 21.2.12 Examining Telnet and SSH in Wireshark | Compare Telnet and SSH | Read a Telnet login in cleartext and showed the SSH session was encrypted |
| 21.4.7 Certificate Authority Stores | Browser CA stores and certificate fingerprints | Compared a site's certificate fingerprint with a reference table and explained why a mismatch alone doesn't prove interception |

### Security data and investigations

| Lab | What it asked | Work done |
|---|---|---|
| 25.3.10 Explore a NetFlow Implementation | Read NetFlow data in Packet Tracer | Filled in the flow fields for a request and its response |
| 25.3.11 Logging from Multiple Sources | Syslog, AAA and NetFlow in Packet Tracer | Read the routing syslog messages, the AAA login entries and the NetFlow data |
| 26.1.7 Snort and Firewall Rules | Trigger a Snort alert, then block the server with iptables | Ran the lab's Snort rule and firewall command and read the results (see above) |
| 27.1.5 Convert Data into a Universal Format | Normalize log timestamps with `awk` | Fixed the first attempt at the Apache conversion, which turned every date into 1970, and summarized five security tools |
| 27.2.9 Regular Expression Tutorial | Learn regular expressions for searching logs | Filled in the metacharacter table and searched a log with a regular expression in `less` |
| 27.2.10 Extract an Executable from a PCAP | Export a file from a capture | Followed the HTTP stream and exported the 345,088-byte executable |
| 27.2.12 Interpret HTTP and DNS Data to Isolate Threat Actor | Find a SQL injection and DNS exfiltration in Kibana | Found the injected request and the data it returned, then decoded the DNS queries back into the stolen file |
| 27.2.14 Isolate Compromised Host Using 5-Tuple | Pivot from Sguil to Wireshark to Kibana | Rebuilt what the attacker ran after getting a root shell, found the FTP transfer that followed and recommended containment steps |
| 27.2.15 Investigating a Malware Exploit | Investigate an exploit kit infection | Rebuilt the chain from a search result to ransomware (see above) |
| 27.2.16 Investigating an Attack on a Windows Host | Investigate a compromised Windows host | Separated a likely misconfiguration from the attack and identified two trojan downloads (see above) |

### Final skills assessment

| Lab | What it asked | Work done |
|---|---|---|
| CyberOps Associates Skills Assessment | Investigate a Pushdo infection from Security Onion alerts and write an after-action report | Built the timeline, identified the host and the three downloaded files, and wrote the report (see above) |

## Skills {#skills}

- Alert triage and timelines in Sguil and Kibana (27.2.14 to 27.2.16, skills assessment)
- Following TCP streams and reading HTTP transcripts (10.6.7, 21.2.12, 27.2.10, 27.2.14 to 27.2.16)
- File hashing and reputation lookups in VirusTotal and Talos (21.1.6, 27.2.15, 27.2.16, skills assessment)
- Spotting cleartext credentials and recommending encrypted protocols (10.6.7, 15.2.7, 21.2.12, 27.2.14)
- Reading DNS for exfiltration and host behavior (17.1.7, 27.2.12, 27.2.16)
- Wireshark filters and header analysis for Ethernet, IP, TCP, UDP and DNS (5.3.7, 8.2.8, 9.2.6, 10.2.7, 10.4.3)
- Log analysis with `journalctl`, syslog, `awk` and regular expressions (4.4.4, 17.2.7, 27.1.5, 27.2.9)
- Windows and Linux administration basics (3.0.3 to 3.3.13, 4.2.6 to 4.5.4)
- Cryptography basics: hashing, AES, password strength and certificate stores (21.1.6 to 21.4.7)
- Writing an after-action report (skills assessment)

## Limits {#limits}

- 28.4.13 Incident Handling is in the repository but blank, so it isn't listed.
- The captures and alert data came from the course and aren't in the repository, so the times and file details can't be rechecked from it alone.
- My Pushdo report says the downloaded files ran on the host, which the alerts don't show, and it calls the OpenDNS lookup service malicious when it's a legitimate service the malware used. The containment steps are recommendations; they weren't carried out.
- Some labs captured traffic on a home network, so this page leaves out their addresses.

## Sources {#sources}

- [CSIA 115 repository](https://github.com/jkosber/CyberOps-115), with every lab above
- [Skills assessment](https://github.com/jkosber/CyberOps-115/blob/main/Module08/CA%20v1.0%20Skills%20Assessment%20-%20Jadon%20Kosberg.docx) and [after-action report](https://github.com/jkosber/CyberOps-115/blob/main/Module08/SkillsExamReportTemplate%20-%20Jadon%20Kosberg.docx)
- [27.2.15 Investigating a Malware Exploit](https://github.com/jkosber/CyberOps-115/blob/main/Module07/27.2.15%20Lab%20-%20Investigating%20a%20Malware%20Exploit%20-%20Jadon%20Kosberg.docx)
- [27.2.16 Investigating an Attack on a Windows Host](https://github.com/jkosber/CyberOps-115/blob/main/Module07/27.2.16%20Lab%20-%20Investigating%20an%20Attack%20on%20a%20Windows%20Host%20-%20Jadon%20Kosberg.docx)
- [26.1.7 Snort and Firewall Rules](https://github.com/jkosber/CyberOps-115/blob/main/Module07/26.1.7%20Lab%20-%20Snort%20and%20Firewall%20Rules%20-%20Jadon%20Kosberg.docx)

[All coursework](index.md) · [Pushdo malware investigation in Security Onion](../technical-labs/soc-threat-detection.md) · [CSIA 210 Network Protocol Analysis](csia-210.md)
