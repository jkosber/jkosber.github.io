---
title: CyberOps & traffic investigation
description: Connected a supplied Pushdo alert timeline to a Windows host, three downloaded objects and historical malware reports; a separate lab recorded Snort alerts and a firewall retest.
kind: Completed coursework
status: Documented March 2026
visual: assets/project-security.svg
---

# CyberOps & traffic investigation

In **CSIA 115: Cyber Ops**, I investigated a historical Pushdo malware scenario using a Cisco-provided Security Onion VM. I narrowed the alert window in Sguil, identified the affected Windows host, inspected reconstructed files in NetworkMiner and recorded existing VirusTotal findings in an after-action report.

A separate [Snort and firewall lab](snort-firewall-lab.md) covered live traffic within a supplied Mininet network: triggering an existing signature, diagnosing a failed HTTP download, inserting a routed firewall rule and recording the retest. A companion exercise recovered an HTTP object from a supplied packet capture.

<div class="evidence-note" markdown>
**Scope and dates:** academic labs completed in March 2026 using course-provided environments and training data. The Pushdo alerts describe June 27, 2017 activity; the assessment screenshots show my analysis on March 8, 2026. The results are historical and have not been retested for this page.
</div>

## Investigating a Pushdo infection

The assessment began with executable-download and Trojan alerts already loaded in Security Onion. The training material credits Malware Traffic Analysis as the scenario's source. I investigated the alerts to identify the affected host and associated files.

I used Sguil to establish the time window and the common internal host, then examined associated traffic with Wireshark and NetworkMiner. Keeping the time window and host together helped distinguish the related alerts from other training events in the same VM.

### Establishing the timeline

The assessment screenshot records the following alert sequence. Times are **UTC on June 27, 2017**, as recorded in my report; the identifiers are Sguil alert IDs.

| Time | Alert IDs | Recorded signal |
|---|---|---|
| 13:38:34 | 5.410, 5.415 | WinHttpRequest executable download and PE executable/DLL download over HTTP. |
| 13:43:52 | 5.420 | Another PE executable/DLL download. |
| 13:43:54 | 5.421, 5.422 | Terse executable downloader and a further PE download. |
| 13:44:01 | 5.428, 5.429 | Public-IP lookup and Pushdo check-in. |
| 13:44:04 | 5.431 | Pushdo command-and-control response. |
| 13:44:32 | 5.438 | Possible Tor SSL traffic. |

Download alerts followed by Pushdo signatures supported the infection assessment. The selected alert window does not reveal the initial entry point or user action; those questions require endpoint evidence.

### Connecting the host to downloaded files

NetworkMiner identified the internal endpoint as Windows and showed its MAC address and a Dell NIC vendor. Those values let me associate the host with the traffic without relying only on a malware label. Its Files view reconstructed three downloaded objects, and the object properties exposed their SHA-256 hashes.

I used those hashes to look up existing VirusTotal reports and recorded the results. The sizes below are visible in the NetworkMiner screenshots; the detection counts are from my written assessment.

| Reconstructed object | Size in bytes | Vendor detections recorded during coursework | Recorded threat label |
|---|---:|---:|---|
| `gerv.gun` | 241,664 | 58 of 70 | Shiotob / Jaik |
| `trow.exe` | 330,752 | 65 of 72 | Cutwail / Wigon |
| `wp.exe` | 307,712 | 61 of 72 | Ursnif / Nymaim |

The hashes linked each object to an existing malware report. These counts are the historical lookup results, not current VirusTotal verdicts or a measure of detection accuracy.

The [skills-assessment submission](https://github.com/jkosber/CyberOps-115/blob/main/Module08/CA%20v1.0%20Skills%20Assessment%20-%20Jadon%20Kosberg.docx) includes the Sguil timeline and NetworkMiner screenshots. The [after-action report](https://github.com/jkosber/CyberOps-115/blob/main/Module08/SkillsExamReportTemplate%20-%20Jadon%20Kosberg.docx) brings the host, files, hashes and recommendations together.

### Separating alert interpretation from proof

Two alerts needed particular care when reviewing the original conclusions:

- **Public-IP lookup:** alert 5.428 records a DNS lookup for the host's public address. It occurs after the initial downloads. Its presence does not make the public DNS resolver malicious or establish that the lookup started the infection.
- **Possible Tor traffic:** alert 5.438 is a signature's classification of traffic. The assessment did not independently establish a working Tor tunnel or the purpose of any encrypted session.

The report also described downloaded files as having run on the endpoint. The preserved screenshots show downloads and network alerts, but no endpoint process telemetry verifies execution.

### Response recommendations

My after-action report recommended host isolation, updated endpoint protection, blocking identified malicious destinations, network segmentation and user training. These were recommendations, not response actions I performed. The exercise ended with investigation and reporting.

A repeat investigation would need the original capture and endpoint logs to examine initial access, process execution and persistence. The repository preserves the report and screenshots, but not the full Security Onion evidence set. That limits independent replay of the incident sequence.

## Testing an alert and a firewall rule

In the Mininet lab, H5 requested a file from H10's nginx service through R1, which ran Snort and `iptables`. My screenshots show an existing Snort signature firing, several HTTP 404 responses caused by an incorrect requested filename, and a successful HTTP 200 download after correcting the name.

I then inserted a DROP rule into R1's FORWARD chain for TCP traffic to the simulated server's listening port. The screenshot confirms the rule was present; my written retest answer records that the download was blocked.

[Read the Snort, firewall and HTTP recovery lab](snort-firewall-lab.md) for the topology, command excerpts, request failure and correction, capture results and retest limits. This used the supplied Snort rule set, not signatures I authored.

## Recovering a file from captured traffic

The companion exercise used Wireshark's **Follow TCP Stream** and **Export Objects → HTTP** on a course-supplied capture. The recovered object was a renamed substitute executable, not real Nimda malware. I saved it under a different filename because a file with the original name already existed.

The stream's HTTP `Content-Length` and the saved file listing both show **345,088 bytes**. That supports recovery of the recorded HTTP object. It is a different artifact from the **475,448-byte** download visible in the earlier Mininet exercise, despite their similar filenames. No hash comparison or executable analysis was recorded for the recovered substitute.

[HTTP recovery evidence and limitations](snort-firewall-lab.md#recovering-the-supplied-http-object) explains the source capture and the verification shown in my submission.

## Course repository

The [CyberOps coursework repository](https://github.com/jkosber/CyberOps-115) also holds exercises in Windows administration, Linux logs and permissions, Nmap, protocol analysis, access control lists and incident handling.

[Networking and packet analysis](cisco-networking-analysis.md) · [Certifications](../credentials/index.md) · [All projects](index.md)
