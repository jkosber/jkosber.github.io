---
title: CyberOps & traffic investigation
description: A Pushdo malware infection traced in Security Onion from the alerts to one Windows host and three downloaded files, then written up as an after-action report.
kind: Completed coursework
status: "March 2026"
tools: [Security Onion, Wireshark, NetworkMiner, VirusTotal]
detail: true
class_page: coursework/csia-115/
class_name: CSIA 115 Cyber Ops
summary:
  role: "Worked the alerts from timeline to host to files, looked up the file hashes and wrote the after-action report. The course provided the Security Onion VM and the alert data."
  built_with: ["Security Onion", "Sguil", "Wireshark", "NetworkMiner", "VirusTotal"]
  result: "Tied a 2017 Pushdo infection to one Windows host and three downloaded malware files by hash, and wrote an after-action report with containment recommendations."
  source: {label: "CSIA 115 repository", url: "https://github.com/jkosber/CyberOps-115"}
---

# CyberOps & traffic investigation

The final skills assessment in CSIA 115 provided a Security Onion VM loaded with alerts from a 2017 Pushdo infection, an exercise Cisco credits to malware-traffic-analysis.net. The investigation narrowed the alerts to one time window and one internal host, matched that host to three downloaded files, looked the files up by hash and ended in an after-action report.

The [Snort and firewall lab](snort-firewall-lab.md) from the same class has its own page.

## Investigating Pushdo alerts {#investigating-a-pushdo-infection}

The investigation started in Sguil, narrowing the alerts to the window where the downloads and the Pushdo signatures clustered, and to the internal host they had in common. That kept them apart from the other training events loaded in the same VM.

### Building the timeline {#establishing-the-timeline}

Times are UTC on June 27, 2017; the numbers are Sguil alert IDs.

| Time | Alert IDs | Alert |
|---|---|---|
| 13:38:34 | 5.410, 5.415 | Executable download through WinHttpRequest, and a PE executable or DLL download over HTTP |
| 13:43:52 | 5.420 | Another PE executable or DLL download |
| 13:43:54 | 5.421, 5.422 | A terse executable downloader and another PE download |
| 13:44:01 | 5.428, 5.429 | A public-IP lookup and a Pushdo check-in |
| 13:44:04 | 5.431 | A Pushdo command-and-control response |
| 13:44:32 | 5.438 | Possible Tor SSL traffic |

Downloads first, then a Pushdo check-in within minutes: that order is what pointed to an infection. The alerts don't show how the first download started.

### Connecting the host to downloaded files

NetworkMiner identified the internal host as a Windows machine and showed its MAC address and a Dell network card. Its Files view rebuilt the three downloaded objects with their SHA-256 hashes, and a VirusTotal lookup on each hash gave these results:

| Object | Size in bytes | VirusTotal detections then | Names VirusTotal listed |
|---|---:|---:|---|
| `gerv.gun` | 241,664 | 58 of 70 | Shiotob, Jaik |
| `trow.exe` | 330,752 | 65 of 72 | Cutwail, Wigon |
| `wp.exe` | 307,712 | 61 of 72 | Ursnif, Nymaim |

The sizes are in the NetworkMiner screenshots and the detection counts in the written answers; today's VirusTotal results may differ. The assessment answer reads: "Pushdo is a downloader trojan so its true purpose is to download and install additional malicious contents."

### Recommendations {#response-recommendations}

The report recommended isolating the host, updating its endpoint protection, blocking the three domains the files came from, segmenting the network and training users.

## Limits {#separating-alert-interpretation-from-proof}

- The report says the downloaded files ran on the host. The alerts show downloads and network traffic, not execution; that would take endpoint logs.
- It also calls the OpenDNS lookup malicious and suggests the lookup started the infection. The lookup came after the first downloads, and OpenDNS is a legitimate service the malware used to find its public address.
- "Possible Tor" is how one signature labels the traffic, not a confirmed Tor connection.
- The recommendations weren't carried out; the exercise ended with the report.
- The repository holds the report and screenshots, not the capture or the Security Onion data, so the sequence can't be replayed from it.

## Sources {#course-repository}

- [Skills assessment](https://github.com/jkosber/CyberOps-115/blob/main/Module08/CA%20v1.0%20Skills%20Assessment%20-%20Jadon%20Kosberg.docx): the Sguil timeline, NetworkMiner screenshots and written answers
- [After-action report](https://github.com/jkosber/CyberOps-115/blob/main/Module08/SkillsExamReportTemplate%20-%20Jadon%20Kosberg.docx): the host, files, hashes and recommendations
- [CSIA 115 repository](https://github.com/jkosber/CyberOps-115), with the rest of the class's labs

[CSIA 115 class page](../coursework/csia-115.md) · [Snort and firewall lab](snort-firewall-lab.md) · [All coursework](../coursework/index.md)
