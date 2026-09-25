---
title: Snort, firewall rules & HTTP recovery
description: Following a simulated HTTP download through Snort alerts, correcting a filename failure, applying a routed firewall rule and recovering an object from a separate supplied capture.
kind: Completed coursework
status: Documented March 2026
detail: true
---

# Snort, firewall rules & HTTP recovery

This CyberOps lab connected a network alert to a specific control: block a simulated server after observing its traffic. I ran the supplied Mininet environment, monitored Snort on its router, downloaded a lab file, captured traffic and added an `iptables` rule. A later exercise used a separate supplied capture to reconstruct an HTTP object.

The lab provided the topology, scripts and Snort signatures. My work was running and checking the environment, interpreting the alert, correcting request errors, applying the prescribed firewall rule and documenting results.

<div class="evidence-note" markdown>
**Historical lab:** screenshots dated March 1, 2026, in submissions saved March 1–2. The HTTP extraction exercise used supplied traffic from 2017. The results come from my screenshots and answers and have not been retested for this page.
</div>

## The simulated traffic path

The CyberOps Workstation VM hosted the Mininet devices. H5 reached H10 through switch s5, R1 and the upstream R4 router. R1 combined routing, Snort inspection and `iptables`; H10 ran nginx on TCP port 6666. H10 represented an external server inside the supplied simulation.

| Component | Role in this test | Evidence in the submission |
|---|---|---|
| H5 | HTTP client and packet-capture point | `wget` requests and capture on `H5-eth0`. |
| R1 | Router, IDS and firewall | Snort startup, alert log and FORWARD-chain rule listing. |
| R4 | Upstream router toward the server segment | Supplied topology diagram. |
| H10 | Simulated file server | `netstat -tunpa` shows nginx listening on TCP/6666. |

The scripts came with the course VM. A screenshot records an initial Mininet launch failing because it required root, followed by a successful launch with `sudo`. Snort then initialized on R1; its startup screenshot identifies version 2.9.15.1 and acquisition from `R1-eth0`.

The command examples below replace the original simulated server address with `198.51.100.133`, a documentation address. The port, flags and filenames retain their roles from the lab. They describe the historical exercise, not a current deployment procedure.

## Distinguishing a bad request from a blocked connection

I monitored R1's alert log while H5 requested the file:

```bash
tail -f /var/log/snort/alert
```

Requests with incorrect spelling or capitalization received **HTTP 404 Not Found**. Those responses showed that the server was reachable and responding, even though the requested resource was wrong. After correcting the filename to `W32.Nimda.Amm.exe`, the same service returned **HTTP 200 OK** and `wget` recorded **475,448 of 475,448 bytes** saved.

The corrected request, with the example address substituted, was:

```bash
wget http://198.51.100.133:6666/W32.Nimda.Amm.exe
```

Snort recorded **Malicious Server Hit!**, signature identifier `1:1000003:0`, with TCP endpoints and an event time. The screenshot shows alerts for attempts before the successful transfer as well as the successful request. An alert alone therefore did not establish that the file had downloaded; the HTTP response and completed-transfer line supplied that additional evidence.

This used an existing lab signature. I did not author the rule or measure its detection rate or false positives.

## Capturing the transaction

On H5, I captured the traffic to a PCAP for later inspection. The submission's terminal screenshot shows the capture command when it was brought back to the foreground:

```bash
tcpdump -i H5-eth0 -w nimda.download.pcap
```

After stopping it, the recorded summary shows **93 packets captured, 93 received by the filter and 0 dropped by the kernel**. The directory listing includes the capture file. These are results from that run, not the different packet counts printed in the worksheet's example output.

The capture covered traffic visible at H5's interface.

## Applying the routed firewall rule

The connection crossed R1 on its way to H10, so the rule belonged in **FORWARD**. INPUT would apply to traffic addressed to R1 itself, and OUTPUT to traffic originating on R1.

I inserted the destination-specific TCP rule and checked the listing:

```bash
iptables -I FORWARD -p tcp -d 198.51.100.133 --dport 6666 -j DROP
iptables -L -v
```

`-I FORWARD` inserts the rule at the start of the chain. The protocol, destination and destination-port options restrict its match to the simulated service; `DROP` discards matching packets. It does not block every protocol or every service on the destination.

| Check | Recorded evidence | What it supports |
|---|---|---|
| Service works before rule | Screenshot of HTTP 200 and completed 475,448-byte download | The requested object was available before filtering. |
| Rule added | Screenshot of the command and FORWARD listing | The specified DROP rule was installed. Its counters were still zero in that screenshot. |
| Request repeated | Written answer says the second download was unsuccessful because the firewall blocked it | A historical reported retest; no student timeout screenshot or later rule counter is preserved. |

The worksheet's sample timeout output comes from the instructions. My blocking-test result is preserved only in the written answer above.

The written answer proposed blocking all traffic to the server as a more aggressive alternative. That would have a wider effect than the selected port rule; it was an alternative described in the assignment, not another change shown in the record.

## Recovering the supplied HTTP object

The next exercise used the course-provided `nimda.download.pcap` from the VM's support files, separately from my earlier capture. Its HTTP object has the same filename but a different size.

I opened the supplied PCAP in Wireshark and followed TCP stream 0. My screenshot shows the HTTP GET, an HTTP 200 response and binary content. Readable strings were embedded in the binary data; the stream also exposed the `MZ` and `PE` markers associated with a Windows executable.

The course explicitly identified this as a substitute executable renamed `W32.Nimda.Amm.exe` for the exercise. I did not execute it or demonstrate malware behavior. My tentative identification of it as a Windows command-related file was not a confirmed reverse-engineering result.

I used **File → Export Objects → HTTP** to save the reconstructed object. Because the original filename already existed, I saved the export as `Wireshark.W32.Nimda.Amm.exe` and checked the directory listing.

| Evidence from the extraction submission | Value |
|---|---|
| HTTP response in the followed stream | `200 OK` |
| Response `Content-Length` | 345,088 bytes |
| Saved `Wireshark.W32.Nimda.Amm.exe` | 345,088 bytes |
| Pre-existing `W32.Nimda.Amm.exe` | 475,448 bytes |

The recovered file's **345,088-byte** size matches the HTTP response length. No hash comparison was recorded, leaving byte-for-byte integrity unverified.

## Limits and source material

The lab covered one HTTP request path, an existing signature and a narrow firewall rule in a supplied simulation. Detection quality, encrypted inspection and rule persistence after restart were not tested. The extraction covered stream reconstruction and object export; sandbox analysis remained a possible next step.

- [Snort and firewall submission](https://github.com/jkosber/CyberOps-115/blob/main/Module07/26.1.7%20Lab%20-%20Snort%20and%20Firewall%20Rules%20-%20Jadon%20Kosberg.docx): topology, historical screenshots, recorded answers and supplied command context.
- [HTTP object-extraction submission](https://github.com/jkosber/CyberOps-115/blob/main/Module07/27.2.10%20Lab%20-%20Extract%20an%20Executable%20from%20a%20PCAP%20-%20Jadon%20Kosberg.docx): supplied-capture scope, followed stream and saved-object listing.

The reviewed repository does not include these PCAPs. Independent replay would require the original capture files; stronger firewall retest evidence would also need the post-rule request output or counters.

[CyberOps and Pushdo investigation](soc-threat-detection.md) · [IPv6 packet investigations](ipv6-packet-investigations.md) · [All projects](index.md)
