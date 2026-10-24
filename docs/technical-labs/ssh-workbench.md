---
title: SSH Workbench
description: A keyboard-driven terminal app for the machines I work on. Pick a machine, connect through OpenSSH, see whether it is reachable and set up key login.
kind: Personal software project
status: Version 0.3.0
tools: [Python 3.14, Textual, OpenSSH, GitHub Actions]
summary:
  role: "I defined what Workbench does, planned each release as small tested tasks and tested it on my own machines."
  built_with: ["Python 3.14", "Textual", "OpenSSH", "uv", "pytest", "Ruff", "GitHub Actions"]
  result: "Five tagged releases from October 20 to 23, 2026, after work began October 9. Version 0.3.0 passes 1,077 automated tests on Windows and Ubuntu."
updated: "October 23, 2026"
screenshot:
  src: assets/evidence/ssh-workbench/workbench-main-2026-10-22.webp
  width: 900
  height: 413
  alt: "SSH Workbench in Windows Terminal. The header counts 5 machines: 3 online, 1 offline and 1 can't check. The Machines list shows Web server, Lab box, Storage NAS, Build runner and Garage Pi, each with its alias or address on the right. The details pane for Lab box shows one row per field: ID, name, status Online at 192.0.2.20, a direct connection, two addresses, user, port 2222, key file and two links. The footer lists Connect, Link, Add, Edit, Delete, Key, Check and Quit."
  caption: "Version 0.3.0 in Windows Terminal, October 22, 2026, with fictional machines and statuses from a stand-in checker"
---

# SSH Workbench

SSH Workbench is a terminal app that keeps the machines I work on in one list, each with its way to connect and its web dashboards. I pick a machine and press C, and my own OpenSSH client takes over the terminal. When the session ends, I'm back in the list with the same machine selected.

It also shows whether each machine's SSH port is answering and walks through setting up key-based login. It runs on Windows 11 and Linux, and I've tested it against my Proxmox host, a Linux Mint laptop and two Windows PCs.

## Why I wanted it

I wanted one place to see each machine, how to reach it and its web dashboards, and to connect without retyping SSH options. I did not want a tool that replaces OpenSSH or stores passwords. Authentication, keys and host-key checks should stay with the SSH client I already use.

## What it does

| Key | What happens |
|---|---|
| C | Workbench suspends itself and runs `ssh` in the same terminal. Typing `exit` brings the list back. |
| R | Checks every machine's SSH port again. Checks also run at startup and every 30 seconds. |
| O | Opens one of the machine's web links, such as a Proxmox dashboard, in the default browser. |
| A, E | Adds or edits a machine in a form that checks each field before saving. |
| X | Deletes the selected machine after asking. |
| K | Sets up key login: pick or create a key, install it on the machine, then test a key-only login. |

Since 0.3.0 the header counts machines by status, and every status keeps its symbol and word, so nothing depends on color. The layout follows the terminal's size: under 60 columns the list sits above the details and the footer wraps onto two rows, and from 110 columns each row shows where the machine connects.

A machine is either an alias from my SSH config or a direct entry with addresses, user, port and key. A direct machine can also be exported as an SSH alias, so `ssh <id>` works in any terminal and in scripts.

## Design decisions

<div class="narrative-list" markdown>

OpenSSH does the connecting
: **Decision.** Workbench checks every machine value against the same rules as its config file, then runs the system `ssh` with an argument list, no shell, and `--` before the destination.
: **Why.** No value from the machine file can turn into an SSH option or a shell command. Passwords, keys, the SSH agent and host-key prompts stay with OpenSSH.

Status checks never log in
: **Decision.** A check opens a TCP connection to the SSH port and closes it without sending anything. For status, aliases are resolved with <code>ssh&nbsp;-G</code> only at startup and on R.
: **Why.** A check every 30 seconds should not add login attempts to a server's auth log. <code>ssh&nbsp;-G</code> can run commands from the SSH config, so it never runs on a timer.

Saves never leave a half-written file
: **Decision.** Each save keeps a `.bak` copy and replaces the file in one step. If another program changed the file since it was loaded, Workbench reloads instead of overwriting.
: **Why.** The machine file may be edited by hand or kept in a synced folder.

Key setup never sees a secret
: **Decision.** K reads only `.pub` files and runs two fixed commands on the machine, in the terminal it hands to SSH.
: **Why.** SSH and `ssh-keygen` ask for passwords and passphrases themselves, so Workbench never handles a credential.

</div>

## How I worked

I developed SSH Workbench with AI coding agents in a test-first workflow. I set each task's goal and acceptance criteria, approved every pull request and release, and tested it on my own machines:

- One task per pull request, with written acceptance criteria in the roadmap.
- Tests first: each fix starts as a failing test.
- Every push runs Ruff, the full test suite, a package build and an installed-package check, on Windows and Ubuntu.
- Real-machine checks use my own machines, and test keys are removed afterwards.

I tested the terminal handoff in Windows Terminal, and the released version is installed as my own tool.

## Testing

The 1,077 tests use fictional machines and a fake status checker. They never touch a real SSH config, key or network.

Around the 0.2.0 release, checks on my own machines covered the parts tests can't:

- A new key installed and logged in alone on the Linux Mint laptop, and as administrator on both Windows PCs.
- Key setup on the Proxmox host, where the key file lives behind a cluster-filesystem link.
- A first connection that asked to trust a new host key. The fingerprint was compared before accepting.

Real use then turned up five key-setup problems, fixed in 0.2.1. For example, a commented-out copy of a key counted as installed, and PowerShell progress output leaked into the result on Windows.

Version 0.2.2 fixed three problems that reviews of earlier versions had set aside:

- Pressing Ctrl+C during key setup could still report "Key login works." and save the key. Now no later step runs after Ctrl+C.
- An RSA key too large for the Windows install command failed only after the password prompt. It is now refused before Workbench connects.
- A machine whose status check took over 30 seconds never left Checking, because each timer round replaced the check still running.

Each fix started as a failing test, and the Ctrl+C handling was also checked in Windows Terminal. The same release moved development and CI to Python 3.14.8 and uv 0.13.4 for their security fixes.

The 0.3.0 layout was checked in Windows Terminal at sizes from 47×16, the narrowest it allows, up to 199×46, including a resize with the edit form open. Before it replaced my installed copy, the release build was installed separately and checked at 80×24, 50×24, 120×30 and 80×18, and it quit cleanly.

## Limits

- macOS is untested, and so is opening links from a Linux desktop session.
- The 0.3.0 layout has been checked in Windows Terminal only, not in Linux or macOS terminals.
- Saving rewrites the machine file in Workbench's own format, so comments and hand formatting are dropped. It asks before the first such save.
- The repository is private, so the source is not linked here.

## Sources

This page draws on the private repository's README, user guide, architecture notes, changelog, validation log and CI results as of October 23, 2026, and on my project notes.

[All projects](index.md) · [Proxmox homelab](proxmox-virtualization.md)
