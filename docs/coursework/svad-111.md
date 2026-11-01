---
title: SVAD 111 Linux and Virtualization Technologies
description: "Linux administration labs in VirtualBox, Bash scripts with input checks, and a two-server AdventureWorks deployment on AWS."
kind: Coursework class
code: SVAD 111
course: Linux and Virtualization Technologies
term: Spring 2026
items: 25 assignments and 5 scripts
repo: https://github.com/jkosber/SVAD-111-Linux-Virtualization
art: {src: assets/thumbnails/aws.svg, width: 240, height: 160}
summary:
  role: "Built the VirtualBox VMs and the two AWS servers, worked the Linux labs, wrote the Bash scripts and wrote the final project report. The course provided the worksheets, the install commands, the application and its data."
  built_with: ["VirtualBox", "Linux Mint and Fedora", "Bash", "AWS EC2", "Ubuntu 22.04", "SQL Server and Apache"]
  result: "Turned in 25 assignments and 5 scripts: Linux administration labs, Bash scripts that reject bad input and exit with an error, and a two-server AdventureWorks deployment on AWS that served the catalog and saved a review."
---

# SVAD 111 Linux and Virtualization Technologies

Linux and Virtualization Technologies covered running Linux in VirtualBox and on AWS, managing it from the command line and scripting it in Bash. The course project was a two-server deployment of the AdventureWorks sample app, built in milestones across the term.

## What the course provided and what I did {#what-the-course-provided}

The course provided the worksheets and their questions, an AWS Academy lab account, the install commands for each project milestone, the application and database archives, and the requirements for each script, including a few one-line hints. My part:

- Built Linux Mint and Fedora VMs in VirtualBox and did the Linux labs on them and on the AWS servers
- Launched the two EC2 servers, ran the database and web installs, imported the data and tested the app
- Wrote the input-checked scripts and the wallpaper downloader in Bash and ran each one
- Wrote the final project report and original answers to the worksheet questions

## Strongest work {#strongest-work}

### AdventureWorks on two AWS servers

The course's two-tier design ran on two Ubuntu EC2 instances: SQL Server on one, Apache and PHP on the other. The finished app returned 304 products on a blank search, opened product pages and saved a review with my name. The report lists the four problems that came up and how I fixed each one. The first was "Connection Timed Out: The web server could not talk to the database," fixed by adding a security-group rule for port 1433 from the web server.

The full write-up is on [AdventureWorks on AWS](../technical-labs/aws-linux-infrastructure.md).

### Rejecting bad input in a Bash game (M05P2B) {#rejecting-bad-input}

The course provided a number-guessing game that crashed on text or an empty answer, plus a one-line test for "is this an integer." The submitted scripts wrap the game in that check, and `ex4.sh` takes the range from two arguments. It has three checks before the game starts, each with its own message and `exit 1`:

- Both arguments present
- Both arguments whole numbers, tested with `[[ "$min_arg" =~ ^[0-9]+$ ]]`
- The maximum greater than the minimum

The worksheet listed seven runs to try. This run covers all seven, from the screenshot in the write-up, with the prompt shortened:

```text
$ ./ex4.sh 1 50
Guess a number between 1 and 50: 45
My number is 14. You guessed 45.
Sorry, better luck next time!
$ ./ex4.sh 50 40
The second number (40) must be greater than the first (50).
$ ./ex4.sh 20 20
The second number (20) must be greater than the first (20).
$ ./ex4.sh 10
Incorrect input detected!!
Please provide a minimum and maximum number
Example: 1 10
$ ./ex4.sh zzz 10
Both arguments must be integers.
$ ./ex4.sh 10 zzz
Both arguments must be integers.
$ ./ex4.sh
Incorrect input detected!!
Please provide a minimum and maximum number
Example: 1 10
```

The checks quote their variables, but none of the four scripts uses `set -euo pipefail`, and the two that read input don't use `read -r`.

### A wallpaper script that checks before it acts (M06P1A)

The assignment asked for a script that takes an image URL and a new name, then downloads the image, scans it for viruses, converts it to JPEG and renames it with its resolution. The course gave hints for the hardest pieces: the URL-to-filename pipeline, the `curl` status check, the `clamscan` call and the resolution regex. The submitted `dl_wallpaper.sh` puts them together, with every check before any real work:

| Check | How the script handles it |
|---|---|
| Wrong number of arguments | Prints usage to stderr and exits 1 |
| URL can't be reached | Prints an error to stderr and exits 1 |
| Any status other than 200 | Prints the status to stderr and exits 1, so redirects are rejected too |
| Infected download | Deletes the file and exits 1 before converting it |
| Not already a JPEG | Converts it with ImageMagick |

The run in the write-up shows the usage message with no arguments, then each progress step and a finished `poptart_2560x1440.jpg` from the course's sample image. What I'd change: `$1`, `$filename` and `$newname` are unquoted throughout, and the filename comes straight from the URL into an unquoted `rm`, so a URL ending in `*` could make it delete other files in the folder.

## Labs {#labs}

### Virtualization and the cloud

| Lab | What it asked | Work done |
|---|---|---|
| M01 Building Virtual Machines | Install two Linux VMs in a Type 2 hypervisor | Built Linux Mint 22.3 and Fedora VMs in VirtualBox; ejected the ISO by hand when Fedora kept booting the installer |
| M01 Pros and Cons to Virtualization | Argue for or against virtualization | Wrote a one-page case covering hardware use, snapshots and the risk of one host failing |
| M03 Presentation: Cloud Computing | Present cloud service models | Built a 12-slide deck on IaaS, PaaS and SaaS, moving to the cloud, its risks and vendors |

### Command line, files and processes

| Lab | What it asked | Work done |
|---|---|---|
| M04 Part 1 Using Linux Programs | Compare the default apps on two distributions; research LAMP, Apache and NGINX, and deb and rpm packages | Filled the app and version table for Mint and Fedora, installing Evolution where Fedora had no mail client, and answered 12 research questions |
| M04 Reflection: Repositories | Compare Linux and Windows software installs, and rolling and point releases | Wrote four answers and compared package repositories with installing software on Windows with Winget |
| M04P1B Command Line Exercises | Shell history, tab completion, shortcuts and man page sections | Predicted what `!ech` would rerun, confirmed it, and wrote why history expansion can run the wrong command |
| M04P2A Hardware Exploration | Inspect the CPU, buses and disks | Captured `uname`, `lscpu`, `lspci`, `lsusb`, `lsblk` and `df` output |
| M04P2B Working with Files | Create, move, delete and link files | Explained why a hard link still opens after the original file is deleted while a soft link breaks |
| M05P1A File Editing | Edit files in vi and nano | Answered the textbook quiz inside vi |
| M05P1B Archiving | `grep`, `find`, regular expressions, redirection, pipes and `tar` | Worked all 12 steps, noted that the worksheet never created the folder it unpacked into, and cleaned up by hand |
| M05P1C Processes | Package tools, `ps`, `pstree` and `top` | Installed a package with apt and inspected the running processes on Ubuntu |
| M05P2A Scripting | Variables, input, math and `if` | Ran the five practice scripts and explained the difference between single and double quotes |
| M05P2B Secure Scripting Basics | Add input checks to a game and take its range from arguments | Wrote four scripts (see above) |

### Security, users and networking

| Lab | What it asked | Work done |
|---|---|---|
| M06P1A Secure Scripting Advanced | Write a script that downloads, scans, converts and renames a wallpaper | Wrote `dl_wallpaper.sh` (see above) |
| M06P2A Linux Security | Read account data in passwd and shadow and check who is logged in | Answered 18 questions on account fields, password aging, `id`, `who` and `w` |
| M06P2B Users and Groups | Add, change and delete users and groups | Added a user, set its comment field, put it in a new group, then deleted it |
| M06P2C Permissions | Change owners and modes and test what can still be deleted | Made a file read-only with `chmod 444` and explained why it could still be deleted from a folder the user owns |
| M07P1 Networking | `ip`, `nmcli`, `ping`, `traceroute` and `dig` | Answered 12 questions, compared VirtualBox NAT with a bridged adapter, and looked up MX, NS, TXT and SOA records |

### AdventureWorks project

| Lab | What it asked | Work done |
|---|---|---|
| Milestone 1 AWS Environment Build | Launch a web server and a database server in EC2 | Launched both Ubuntu instances in the AWS Academy lab |
| Milestone 2A Database Server Setup | Install SQL Server and `sqlcmd` | Installed and configured SQL Server 2022, checked the service and ran a test query with the entered name |
| Milestone 2B Database Server Setup | Convert and import the AdventureWorks data | Imported the data and checked the counts: 504 products and 19,972 people |
| Milestone 3A Web Server Setup | Open the application ports in the security group | Added rules for ports 80, 1433 and 3306 next to SSH |
| Milestone 3B Web Server Setup | Install Apache, PHP 8.1 and the SQL Server drivers | Brought up a `test.php` page showing PHP 8.1.2 under Apache |
| Milestone 3C Web Server Setup | Deploy the app and test it | Searched the catalog, opened product 787 and saved a review |
| Milestone 4 Final report | Write up the build | Wrote the summary, the build steps, a table of four problems and their fixes, and three recommendations |

## Skills {#skills}

- Building and running Linux VMs in VirtualBox, on two distributions (M01, M04 Part 1)
- Launching EC2 servers and opening security-group ports between tiers (Milestones 1 and 3A)
- Installing SQL Server on Linux, importing data and checking it with `sqlcmd` (Milestones 2A and 2B)
- Setting up Apache and PHP with database drivers and deploying a PHP app (Milestones 3B and 3C)
- Bash scripting with input checks, error messages on stderr and exit codes (M05P2B, M06P1A)
- Command-line work with files, links, archives, processes and packages (M04, M05P1A to M05P1C)
- Users, groups, ownership and permissions (M06P2A to M06P2C)
- Network and DNS diagnostics with `ip`, `nmcli`, `traceroute` and `dig` (M07P1)
- Writing up a build with its problems and fixes (final report)

## Limits {#limits}

- The AdventureWorks install commands came from the course. For most install steps the submitted files show the finished result, not each command.
- The `dl_wallpaper.sh` in the repository is 24 bytes shorter than the copy listed in the run screenshot, so it's a slightly different version of the one that ran.
- The M05P2A practice scripts appear only in screenshots; they aren't in the repository.
- Two Module 1 files in the repository are empty, so they aren't listed here.
- The worksheets offered Ubuntu and Fedora versions of some steps. The submissions follow the Ubuntu ones.

## Sources {#sources}

- [SVAD 111 repository](https://github.com/jkosber/SVAD-111-Linux-Virtualization), with every assignment above
- [AdventureWorks final report](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/AdventureWorks%20Project%20-%20Jadon%20Kosberg.docx)
- [M05P2B write-up](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/Module05/M05P2B%20-%20Secure%20Scripting%20-%20Basics%20-%20Jadon%20Kosberg.docx) and [`ex4.sh`](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/VM_Share/m05p2b/ex4.sh)
- [M06P1A write-up](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/Module06/M06P1A%20-%20Secure%20Scripting%20Advanced%20-%20Jadon%20Kosberg.docx) and [`dl_wallpaper.sh`](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/VM_Share/dl_wallpaper.sh)
- [M04P2B write-up on links](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/Module04/M04P2B%20-%20Linux%20Working%20with%20Files%20-%20Jadon%20Kosberg.docx)

[All coursework](index.md) · [AdventureWorks on AWS](../technical-labs/aws-linux-infrastructure.md) · [Proxmox homelab](../technical-labs/proxmox-virtualization.md)
