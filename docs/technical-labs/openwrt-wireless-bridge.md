---
title: OpenWrt wireless bridge
description: "A spare D-Link DIR-885L running OpenWrt, joined to the home router's 5 GHz Wi-Fi as a client and relaying its wired ports to the homelab, in place of a 2.4 GHz range extender."
kind: Personal homelab
status: Ongoing
summary:
  role: "Compared the bridging options, upgraded and locked down OpenWrt on a spare router, replaced its 5 GHz radio firmware, bench-tested the relay and moved the lab onto it."
  built_with: ["OpenWrt 25.12.6", "D-Link DIR-885L", "relayd", "brcmfmac Wi-Fi driver", "iperf3", "Uptime Kuma"]
  result: "Moved the lab's uplink from a 2.4 GHz range extender to 5 GHz with every lab address unchanged and 27 seconds offline. Lab-to-home throughput went from about 47 Mbit/s to between 239 and 272 Mbit/s in the same test. Passed a 19-hour soak with all nine Uptime Kuma monitors at 100% and three Wi-Fi drops of 5 to 7 seconds that no monitor caught."
updated: "TODO(soak): publish date"
---

# OpenWrt wireless bridge

There's no cable between the homelab and the home router yet, so one Wi-Fi link carries all of the lab's traffic. Until November 11, 2026, that link was a Netgear WN2000RPTv2 range extender on 2.4 GHz 802.11n. I replaced it with a spare D-Link DIR-885L running OpenWrt, which joins the home router's 5 GHz Wi-Fi as an ordinary client and relays its wired ports onto the home network.

Lab hosts kept their addresses, and the home router is still the only DHCP server and gateway. The bridge is the step before a Cat6 run to the lab, which stays on the [homelab roadmap](proxmox-virtualization.md#next-changes).

**TODO(soak): this page is a draft.** The [soak test](#soak-test) passed after 19 hours on November 11 but didn't cover the household's evening, when the house uses Wi-Fi most. The count of evening drops and the response chosen for the band-steering drops are not known yet.

## How the bridge fits in {#how-the-bridge-fits-in}

<figure class="architecture">
  <ol class="architecture-flow" role="list">
    <li><strong>Lab side</strong><span>Proxmox host on LAN port 1<br>LAN ports 2 to 4 empty<br>Gigabit ports</span><small>Addresses unchanged</small></li>
    <li><strong>DIR-885L</strong><span>OpenWrt 25.12.6<br>relayd between the wired ports and Wi-Fi<br>No access point, DHCP server off</span><small>5 GHz client</small></li>
    <li><strong>Home router</strong><span>TP-Link Archer AX90<br>Its channel-44 radio, 80 MHz<br>DHCP and gateway for both sides</span><small>Internet</small></li>
  </ol>
  <figcaption>The lab's uplink as of November 11, 2026, with addresses left out.</figcaption>
</figure>

`relayd` is a pseudo-bridge. It answers ARP on each side for the hosts on the other and forwards DHCP between them, so the lab and the home network share one subnet without a true layer-2 bridge. The home network sees every lab host at the bridge's own Wi-Fi MAC address, as it did with the extender, and the lab sees home hosts at the bridge's MAC address too.

## Choosing relayd {#choosing-relayd}

OpenWrt's documentation suggests WDS when both ends run OpenWrt, and `relayd` when the main router runs other firmware. The home router runs TP-Link's stock firmware, and the DIR-885L's Wi-Fi driver limits the choice further:

| Option | On this hardware | Outcome |
|---|---|---|
| WDS client (4-address) | `brcmfmac` returns "not supported" for the WDS and AP/VLAN interface types, and `iw list` on this unit shows neither | Not available |
| 802.11s mesh | The driver returns "not supported" for mesh point; the stock router has no 802.11s | Not available |
| `relayd` pseudo-bridge | Works with any access point, because the uplink is an ordinary client; a DIR-885L owner on the OpenWrt forum reported it working in 2024 | Chosen |
| Routed client on its own subnet | Works, but every lab address, monitor and URL would change | Rejected |

`relayd` has three costs. It carries IPv4 only, so IPv6 link-local traffic across the bridge stops; the home network has no global IPv6 to lose. It doesn't relay multicast such as mDNS. And the whole lab shares one MAC address on the home network.

## Bench setup and upgrade {#bench-setup}

The DIR-885L already ran OpenWrt 24.10.4 on factory defaults, so the install was an upgrade to 25.12.6 that discarded the old settings. Before flashing I checked the image's hash against OpenWrt's signed checksum list and ran a dry-run of the upgrade.

The DIR-885L stayed off the home network until I had configured it. Its bench cable went to a USB Ethernet adapter in its own Linux network namespace, because OpenWrt's defaults run a DHCP server and the D-Link's bootloader recovery mode answers on the home router's own address.

Before any radio came on, I set a root password, installed an SSH key and proved key login in a second connection, then turned password login off. Next I turned off the DHCP server and IPv6 router advertisements on the wired side, deleted the default access points and bound the web interface (LuCI) to the management address only. The management address change came last, so a mistake couldn't lock me out of the DIR-885L.

## The radio firmware problem {#radio-firmware}

The 5 GHz radio firmware that OpenWrt ships for the DIR-885L, version 10.28.2, broke the uplink. The DIR-885L associated and completed the WPA2 handshake, then 39 of 44 transmits failed, no DHCP lease came back and no frames reached the home network. Lowering transmit power to 5 dBm changed nothing, and 2.4 GHz worked with the same file: 180 of 180 pings. The OpenWrt device page and OpenWrt issue #16114 describe this failure for access-point mode only.

I compared the shipped file with older builds:

| Firmware | Where it came from | Result |
|---|---|---|
| 10.28.2 | Shipped with OpenWrt | 5 GHz fails as above |
| 10.10.69.3309 (2016) | OpenWrt's own 18.06.9 package; package index signature verified | Passed the 15-minute 5 GHz test; DHCP and `iperf3` through the relay worked |
| 10.10.69.69042 (built August 2021) | An attachment on OpenWrt issue #16114; its MD5 and SHA-256 match values two other commenters posted | Same performance as the 2016 build; kept as the newer one and in use |
| 10.10.122.45 | A third-party repository the device page links | Downloaded and hash-checked, not installed: no DIR-885L report behind it |

The 2021 build's origin rests on those matching hashes. It's said to match the firmware in an Asus RT-AC88U, and I haven't checked it against Asus's own download. All three files that ran on the radio stay on the bridge and on the upgrade keep-list. An upgrade or a firmware package update can still put the failing file back if the keep-list isn't honored, so the loaded version needs a check after each one.

With every file, the DIR-885L's 5 GHz radio never saw the home router's second 5 GHz radio on channel 157, and the driver logs `no clm_blob available, device may have limited channels`. I had planned the uplink for that radio. It is locked to the home router's channel-44 radio instead, so a router swap or a channel change on that radio needs a config change on the bridge.

## Configuration

| Item | Setting |
|---|---|
| Firmware | OpenWrt 25.12.6, kernel 6.12.112, with `relayd` and `luci-proto-relay` added |
| Radio firmware | 10.10.69.69042 on the 5 GHz radio; the 2.4 GHz radio off |
| Uplink | 5 GHz client locked to the home router's channel-44 radio, WPA2-PSK, United States regulatory domain |
| Bridge | `relayd` between the wired ports and the Wi-Fi client; the bridge's own address is the one host address outside the home router's DHCP pool |
| Wired ports | A separate management subnet with no DHCP server or IPv6 router advertisements; no access point on the bridge |
| WAN | Interfaces removed and the WAN firewall zone left empty |
| Access | SSH with keys only; LuCI on the management address only, reached through an SSH tunnel |
| Trust store | The `emSign ECC Root CA - G3` root removed from the CA bundle, as on the other lab hosts after the October certificate authority compromise |
| Monitoring | Two Uptime Kuma monitors with Discord alerts: a ping to the home router through the bridge, and the bridge's SSH port |

The ping monitor targets the home router, not the bridge, because the bridge answers on its own address even when its Wi-Fi uplink is down.

## Bench tests

These ran next to the home router, at a signal of about -20 to -28 dBm, so they show the bridge works but not how fast it is at the lab.

| Test | Result |
|---|---|
| 15-minute 5 GHz test, bridge to home router (2016 firmware) | 900 of 900 pings, average 2.018 ms, no disconnects |
| 30-minute test across the relay (2021 firmware) | 1,800 of 1,800 pings, average 2.521 ms, maximum 17.5 ms, no disconnects and none of 842,709 transmits failed |
| `iperf3`, 30 seconds across the relay | 228 Mbit/s home network to lab side, 388 Mbit/s lab side to home network |
| DHCP through the relay | The full exchange with the home router; a test client got a lease |
| 2.4 GHz fallback | The relay moved to the 2.4 GHz interface; 30 of 30 pings, 102 Mbit/s each way |
| Simulated 23-second uplink outage | Reconnected within 3 seconds; the relay stayed up and traffic resumed on its own |
| Three reboots | The uplink and relay came back on their own each time |

## Cutover

At 01:20 on November 11 I moved the lab switch's uplink cable from the extender to the bridge, and the lab was offline for 27 seconds. At the lab position the 5 GHz signal was -54 to -56 dBm with link rates of 867 to 1,083 Mbit/s. Every lab service answered afterwards, and Uptime Kuma showed no downtime across the move. During the cutover I also added a DHCP reservation for the Proxmox host, whose static address sat inside the home router's DHCP pool without one.

The same commands that measured the extender the night before measured the bridge:

| Measurement | Range extender | DIR-885L |
|---|---|---|
| Proxmox host to home router, 200 pings | No loss, average 2.124 ms, maximum 31.25 ms | No loss, average 2.241 ms, maximum 6.6 ms |
| Lab to home network, 40 MB over SSH | 46.2 and 47.7 Mbit/s | 239 to 272 Mbit/s |
| Home network to lab, 40 MB over SSH | 76.6 and 78.7 Mbit/s | 219 to 226 Mbit/s |
| Lab to home network, 400 MB over SSH | Not measured | 305 to 369 Mbit/s |
| Home network to lab, 400 MB over SSH | Not measured | 247 to 248 Mbit/s |

Moving the Proxmox host's cable from the switch straight to the bridge's second port made no meaningful difference, so the Wi-Fi hop is the limit.

During validation the service VM stopped answering. The bridge wasn't the cause: the stall happened from inside the lab too, and a log query I had run on the VM as a check had started a read storm on its hard disk, which held a 1.5 GB journal. I restarted the VM once and then capped its journal at 200 MB.

The service VM took a fresh lease from the home router through the bridge at 01:30, ten minutes after the cutover. No lease renewal will show up, because the home router gives reserved addresses an unlimited lease.

## Soak test and band-steering drops {#soak-test}

The soak started at the 01:20 cutover and was planned for 24 hours. I ended it at the 19-hour mark, 20:20 on November 11, because the results had stayed stable all day. At the end:

| Check | Result at 19 hours |
|---|---|
| Uptime Kuma | All nine monitors at 100% over the previous 24 hours, with no down beats |
| Lines containing "deauth" in the bridge's log | 0 |
| Bridge uptime | 19 hours 11 minutes, no reboot since the cutover |
| Uplink | The home router's channel-44 radio at -56 dBm, 1,083 Mbit/s link rate, no failed transmits |
| Bridge to home router, 10 pings | 10 of 10, average 1.908 ms |
| Software | OpenWrt 25.12.6, `relayd` running, radio firmware 10.10.69.69042 still loaded |

The soak didn't cover 20:20 to 01:20, the household's evening, when the house uses Wi-Fi most. The bridge keeps logging, and a count of the evening's drops is due early on November 12.

During the soak I also simplified the cabling. At 19:22 I unplugged the 24-port lab switch from the bridge: the lab has too few wired devices to need it, and nothing was plugged into it. At 19:30 I moved the Proxmox host's cable from LAN port 2 to LAN port 1, a 3-second outage. All four LAN ports belong to one bridge interface in the configuration, so no setting changed. Afterwards the port ran at 1,000 Mbit/s full duplex, the three lab hosts and six services answered, and Uptime Kuma recorded no downtime.

The range extender had stayed powered and unplugged as the rollback. After the soak passed I retired it.

The Wi-Fi link dropped three times in the whole soak, at 13:27, 16:04 and 16:56, for about 5, 5 and 7 seconds, and not again before 20:20. The bridge's normal log only holds about nine hours, but its kernel log reaches back to boot and holds exactly three of the driver's `Unknown Frame: category 0xa, action 0x8` lines, one per drop, so the count covers the whole soak. Uptime Kuma registered none of the three. Each followed the same sequence:

1. The home router sent an 802.11v steering request toward its other 5 GHz radio.
2. The DIR-885L's radio firmware moved there on its own, because firmware roaming is on. It associated with that radio and received handshake frames from it, although the bridge's scans never list that radio.
3. The lock to the channel-44 radio lives in `wpa_supplicant`, not in the firmware. It didn't stop the move, but it made `wpa_supplicant` refuse the key handshake on the other radio.
4. After four failed handshakes the link dropped with reason code 2, and the bridge was back on the channel-44 radio a second later. The log can't show which side ended it.

This cause comes from reading the `wpa_supplicant` and `brcmfmac` source code alongside read-only checks on the bridge; a second pass through the source added the association and handshake frames in step 2. The firmware acting on the steering request is an inference from the timing and a missing log line; nothing read it from the firmware itself.

The soak passed its written condition, a count of log lines containing "deauth", which stayed at 0 because none of the drop lines contains that word. The condition's intent, no disconnects, wasn't fully met: the three drops are disconnects, short enough that no monitor caught them.

I haven't chosen or tested a response to the drops yet. The options:

- Accept short drops.
- Turn firmware roaming off on the bridge with the `brcmfmac` module option `roamoff=1`, a reboot, and the module options file on the upgrade keep-list. The first source analysis pointed to this fix, but it isn't confirmed to cover roams the home router asks for.
- Turn Smart Connect off on the home router, which changes band selection for every device in the house.
- Remove the bridge's lock to the channel-44 radio so the roam completes. This carries the most risk, because the other radio was never tested for data.

`wpa_supplicant`'s `disable_btm` option, which turns off its steering support, is ruled out: the firmware does the roam, and the `brcmfmac` driver passes only vendor-specific elements from `wpa_supplicant` into the association request.

**TODO(soak): the count of evening drops from the bridge's log, and the response chosen for the steering drops.**

## Lessons {#lessons}

- The shipped radio firmware completed the WPA2 handshake while 39 of 44 transmits failed, so a successful association says little about the data path.
- The lock to one radio lived in `wpa_supplicant`, and the radio firmware roamed anyway on a steering request.
- The "deauth" count stayed at 0 through three Wi-Fi drops; a pass condition has to count the failure it exists to catch.
- A log query I ran as a read-only check stalled every service on the VM.

## Limits

- The soak ran 19 of a planned 24 hours and didn't cover the household's evening, when the house uses Wi-Fi most. **TODO(soak): add the evening drop count.**
- I haven't chosen or tested a response to the band-steering drops.
- I haven't checked the 2021 radio firmware against Asus's own download; its origin rests on matching hashes posted by other users.
- The service VM took a fresh DHCP lease through the bridge, but no lease renewal has gone through it.
- Nine key files in the first configuration backup matched the live bridge. I took a fresh backup at 20:20, right after the soak, and haven't restored either one. OpenWrt's failsafe mode and a factory reset are untested on this unit.
- Uptime Kuma runs on a VM inside the lab, so when the bridge is down its alerts arrive only after the link returns.
- Bench figures come from next to the home router, and every figure comes from one day of tests.

## Next changes

- A fixed MAC address on the bridge's wired side, which gets a new random one at every boot, set at the bridge's next reboot.
- The Cat6 run that replaces the Wi-Fi hop, on the [homelab roadmap](proxmox-virtualization.md#next-changes).

## Sources

This page draws on my project notes and the bridge's working plan, which stay private because they hold network details, and on these public sources:

- **TODO(pin):** the bridge's write-up in the [JHomelab repository](https://github.com/jkosber/JHomelab), linked at a pushed commit once it exists
- [OpenWrt device page for the DIR-885L](https://openwrt.org/toh/d-link/dir-885l): supported hardware, install, recovery and the 5 GHz firmware issue
- [OpenWrt's Wi-Fi extender guide with relayd](https://openwrt.org/docs/guide-user/network/wifi/relay_configuration): when to use `relayd` instead of WDS or 802.11s
- [`brcmfmac` driver source](https://github.com/torvalds/linux/blob/master/drivers/net/wireless/broadcom/brcm80211/brcmfmac/cfg80211.c): the interface types it refuses
- [OpenWrt forum thread on a DIR-885L as a relayd client](https://forum.openwrt.org/t/help-with-wireless-repeater-mode-on-openwrt/199949): the June 2024 report the design relied on

[All projects](index.md) · [Proxmox homelab](proxmox-virtualization.md)
