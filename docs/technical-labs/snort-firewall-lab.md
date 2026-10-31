---
title: Snort, firewall rules & HTTP recovery
description: A CSIA 115 lab where a Snort alert fired on a simulated malware download, a firewall rule blocked the server, and a file was exported from a separate capture.
kind: Completed coursework
status: "March 2026"
detail: true
class_page: coursework/csia-115/
class_name: CSIA 115 Cyber Ops
summary:
  role: "Ran the course's Mininet lab, watched Snort on its router, fixed mistyped file requests, applied the lab's firewall rule and wrote up the results. The lab provided the topology, scripts, Snort signature and firewall command."
  built_with: ["Mininet", "Snort 2.9", "iptables", "tcpdump", "Wireshark"]
  result: "The lab's Snort signature fired on the download, a corrected file name returned HTTP 200, and after the DROP rule the written retest says the download failed. A second exercise exported a 345,088-byte file from a capture."
  source: {label: "CSIA 115 repository", url: "https://github.com/jkosber/CyberOps-115"}
---

# Snort, firewall rules & HTTP recovery

This CSIA 115 lab tied an alert to a fix: watch Snort flag a download from a simulated malicious server, then block that server on the router. That meant running the course's Mininet network, correcting mistyped file names in the requests along the way, capturing the traffic and adding the firewall rule. A second exercise pulled a file out of a capture with Wireshark.

The course provided the topology, the start scripts, the Snort signature and the firewall command.

## The simulated traffic path

Everything ran in Mininet on the CyberOps Workstation VM. H5, the client, reached H10, a server running nginx on TCP port 6666, through switch s5 and routers R1 and R4. R1 also ran Snort and `iptables`.

| Device | Role |
|---|---|
| H5 | Client and capture point |
| R1 | Router, Snort sensor and firewall |
| R4 | Upstream router toward the server |
| H10 | Simulated malicious server, nginx on TCP 6666 |

The first Mininet launch failed because it needs root, and it started with `sudo`. Snort 2.9.15.1 then came up on `R1-eth0`. The commands below use `198.51.100.133`, a documentation address, in place of the lab's server address.

## Distinguishing a bad request from a blocked connection

While `tail -f` followed R1's alert log, H5 requested the file:

```bash
tail -f /var/log/snort/alert
```

The first requests had the file name's spelling or capitalization wrong and got HTTP 404, which showed the server was up and answering. With the name corrected, it returned HTTP 200 and `wget` saved all 475,448 bytes:

```bash
wget http://198.51.100.133:6666/W32.Nimda.Amm.exe
```

Snort logged **Malicious Server Hit!** (signature `1:1000003:0`) for the failed attempts as well as the successful one. So the alert alone didn't mean a file had come down; the 200 and the completed transfer did.

## Capturing the transaction

On H5, `tcpdump` captured the traffic to a file:

```bash
tcpdump -i H5-eth0 -w nimda.download.pcap
```

It caught 93 packets with none dropped.

## Applying the routed firewall rule

The traffic passes through R1 on its way to H10, so the rule belongs in the FORWARD chain; INPUT covers traffic addressed to R1 itself and OUTPUT covers traffic R1 sends. These commands insert the lab's rule and list it:

```bash
iptables -I FORWARD -p tcp -d 198.51.100.133 --dport 6666 -j DROP
iptables -L -v
```

It drops TCP traffic to that server's port 6666 and nothing else. The listing showed the rule in place, with its counters still at zero. When the request ran again, the download failed; the written answer puts that down to the firewall.

## Recovering an HTTP object from a capture {#recovering-the-supplied-http-object}

The next exercise used a capture the course provided, `nimda.download.pcap`, rather than the one from the Mininet lab. The file inside is a harmless executable the course renamed `W32.Nimda.Amm.exe` for the exercise.

Following TCP stream 0 in Wireshark showed an HTTP GET, a 200 response with a `Content-Length` of 345,088, and binary data starting with the `MZ` and `PE` markers of a Windows executable. **File → Export Objects → HTTP** saved the executable as <code>Wireshark.<wbr>W32.Nimda.Amm.exe</code>, because the original name was already taken. The saved file is 345,088 bytes, matching the response. It's a different file from the 475,448-byte download in the Mininet lab, despite the shared name.

## Limits {#limits-and-source-material}

- The Snort signature and the firewall command came with the lab, and the signature's detection and false-positive rates weren't measured.
- There's no screenshot of the blocked retest, and the captured listing shows the rule's counters at zero, so the block rests on the written answer.
- The lab covered one HTTP request path. Encrypted traffic and whether the rule survives a restart weren't tested.
- The exercise checked the exported file's size, not its hash, and never ran it.
- The repository doesn't include either capture, so neither exercise can be replayed from it.

## Sources

- [26.1.7 Snort and Firewall Rules](https://github.com/jkosber/CyberOps-115/blob/main/Module07/26.1.7%20Lab%20-%20Snort%20and%20Firewall%20Rules%20-%20Jadon%20Kosberg.docx): topology, screenshots and written answers
- [27.2.10 Extract an Executable from a PCAP](https://github.com/jkosber/CyberOps-115/blob/main/Module07/27.2.10%20Lab%20-%20Extract%20an%20Executable%20from%20a%20PCAP%20-%20Jadon%20Kosberg.docx): the followed stream and the saved file listing

[CSIA 115 class page](../coursework/csia-115.md) · [CyberOps & traffic investigation](soc-threat-detection.md) · [All coursework](../coursework/index.md)
