---
title: SSH Workbench
description: A keyboard-driven terminal app for the machines I work on. Pick a machine, connect through OpenSSH, see whether it is reachable and set up key login.
kind: Personal software project
status: Version 0.2.1
visual: assets/project-terminal.svg
tools: [Python, Textual, OpenSSH, GitHub Actions]
---

# SSH Workbench

SSH Workbench is a terminal app that keeps the machines I work on in one list, each with its way to connect and its web dashboards. I pick a machine and press C, and my own OpenSSH client takes over the terminal. When the session ends, I'm back in the list with the same machine selected.

It also shows whether each machine's SSH port is answering and walks through setting up key-based login. Version 0.2.1 runs on Windows 11 and Linux, and I've tested it against my Proxmox host, a Linux Mint laptop and two Windows PCs.

<div class="glance" markdown>

My role
: I defined what Workbench does, planned each release as small tested tasks and tested it on my own machines.

Built with
: Python 3.14, Textual, OpenSSH, uv, pytest, Ruff and GitHub Actions.

Result
: Three tagged releases on October 20 and 21, 2026, after work began October 9. The current code passes 1,046 automated tests on Windows and Ubuntu.

</div>

<div class="evidence-note" markdown>
**Version 0.2.1, October 2026.** From the project's README, changelog and CI results. The repository is private.
</div>

## Why I wanted it

I wanted one place to see each machine, how to reach it and its web dashboards, and to connect without retyping SSH options. I did not want a tool that replaces OpenSSH or stores passwords. Authentication, keys and host-key checks should stay with the SSH client I already use.

## What it does

<figure class="evidence-figure">
  <div class="evidence-scroll" role="region" tabindex="0" aria-label="SSH Workbench machine list and details; scroll horizontally if needed">
    <img src="../../assets/evidence/ssh-workbench/workbench-main-2026-10-21.webp" width="800" height="449" alt="SSH Workbench in a terminal. A Machines list shows Garden demo and Studio box online, Print server offline and Jump demo as can't check. The details pane for Studio box shows its ID, name, status Online at 192.0.2.40, a direct connection and two addresses. The footer lists Connect, Link, Add, Edit, Delete, Key, Check and Quit." loading="lazy">
  </div>
  <figcaption>The machine list and details pane, captured October 21, 2026 from the current code. The machines and addresses are fictional and the status results are simulated. <a href="../../assets/evidence/ssh-workbench/workbench-main-2026-10-21.webp">Open the full-size screenshot</a>.<span class="evidence-hint"> Scroll horizontally to inspect the image.</span></figcaption>
</figure>

| Key | What happens |
|---|---|
| C | Workbench suspends itself and runs `ssh` in the same terminal. Typing `exit` brings the list back. |
| R | Checks every machine's SSH port again. Checks also run at startup and every 30 seconds. |
| O | Opens one of the machine's web links, such as a Proxmox dashboard, in the default browser. |
| A, E | Adds or edits a machine in a form that checks each field before saving. |
| X | Deletes the selected machine after asking. |
| K | Sets up key login: pick or create a key, install it on the machine, then test a key-only login. |

A machine is either an alias from my SSH config or a direct entry with addresses, user, port and key. A direct machine can also be exported as an SSH alias, so `ssh <id>` works in any terminal and in scripts.

## Design decisions

<div class="narrative-list" markdown>

OpenSSH does the connecting
: **Decision.** Workbench checks every machine value against the same rules as its config file, then runs the system `ssh` with an argument list, no shell, and `--` before the destination.
: **Why.** No value from the machine file can turn into an SSH option or a shell command. Passwords, keys, the SSH agent and host-key prompts stay with OpenSSH.

Status checks never log in
: **Decision.** A check opens a TCP connection to the SSH port and closes it without sending anything. For status, aliases are resolved with `ssh -G` only at startup and on R.
: **Why.** A check every 30 seconds should not add login attempts to a server's auth log. `ssh -G` can run commands from the SSH config, so it never runs on a timer.

Saves never leave a half-written file
: **Decision.** Each save keeps a `.bak` copy and replaces the file in one step. If another program changed the file since it was loaded, Workbench reloads instead of overwriting.
: **Why.** The machine file may be edited by hand or kept in a synced folder.

Key setup never sees a secret
: **Decision.** K reads only `.pub` files and runs two fixed commands on the machine, in the terminal it hands to SSH.
: **Why.** SSH and `ssh-keygen` ask for passwords and passphrases themselves, so Workbench never handles a credential.

</div>

## How I worked

I planned SSH Workbench as a series of small tasks, each with written acceptance criteria in the project's roadmap, and shipped each one as a pull request:

- Tests first: each fix starts as a failing test.
- Every push runs Ruff, the full test suite, a package build and a check of the installed package, on Windows and Ubuntu.
- Real-machine checks use my own machines, and test keys are removed afterwards.

I tested the terminal handoff in Windows Terminal, and the released version is installed as my own tool.

## Testing

The 1,046 tests use fictional machines and a fake status checker. They never touch a real SSH config, key or network.

Around the 0.2.0 release, checks on my own machines covered the parts tests can't:

- A new key installed and logged in alone on the Linux Mint laptop, and as administrator on both Windows PCs.
- Key setup on the Proxmox host, where the key file lives behind a cluster-filesystem link.
- A first connection that asked to trust a new host key. The fingerprint was compared before accepting.

Real use then turned up five key-setup problems, fixed in 0.2.1. For example, a commented-out copy of a key counted as installed, and PowerShell progress output leaked into the result on Windows.

## Limits

- macOS is untested, and so is opening links from a Linux desktop session.
- Saving rewrites the machine file in Workbench's own format, so comments and hand formatting are dropped. It asks before the first such save.
- The repository is private, so the source is not linked here.

## Sources

This page draws on the private repository's README, architecture notes, changelog and CI results as of October 21, 2026, and on my project notes.

[All projects](index.md) · [Proxmox homelab](proxmox-virtualization.md)
