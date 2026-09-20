---
title: AdventureWorks on AWS
description: Deployment and troubleshooting of a course-provided product-review application on separate AWS web and database servers.
kind: Completed coursework
status: Complete
visual: assets/project-aws.svg
---

# AdventureWorks on AWS

For **SVAD 111: Linux & Virtualization Technologies**, I deployed a product-review application on AWS. The assignment used the AdventureWorks sample business and dataset: users could search a product catalog, open a product page, and submit a rating and comment.

The course provided the application files and a two-tier design. My work was to provision the Linux servers, install and configure the software, connect the web application to its database, troubleshoot setup problems, and test the result. I documented the completed project in my final report on May 8, 2026.

<figure class="case-visual">
  <img src="../../assets/project-aws.svg" width="600" height="340" alt="A web server connected to a separate database server." loading="lazy">
  <figcaption>Simplified view of the coursework application's two tiers.</figcaption>
</figure>

## Server setup

I provisioned two Ubuntu 22.04 instances in EC2. One hosted Apache and PHP, and the other hosted Microsoft SQL Server. The web server handled the browser interface; the database server held the catalog and review data. This made the connection between the two servers an essential part of the deployment.

I used PuTTY for SSH access and WinSCP to transfer the supplied files. The EC2 security-group configuration allowed the access needed for administration, HTTP and the database connection. The [initial infrastructure submission](https://github.com/jkosber/SVAD-111-Linux-Virtualization/tree/main/Module03) records the two instances.

## Database and application configuration

On the database server, I installed Microsoft SQL Server for Linux and its command-line tools. I transferred the AdventureWorks dataset and used `sqlcmd` to load it. Before working through the application, I queried the database directly to check that the import had populated the tables.

On the web server, I installed Apache, PHP and the drivers PHP needed to communicate with SQL Server. I checked PHP through a `test.php` page, transferred the provided web files, and placed them in Apache's document directory. I then updated the application's configuration to point to the database server.

The work crossed several boundaries: files had to be in the right place, PHP needed the database drivers, the application needed the correct connection settings, and EC2 had to permit the traffic. Getting a page to load was only one part of checking the complete application.

## Troubleshooting

My final report records several setup problems and the changes I made:

- **The web server could not reach the database.** I traced the timeout to the EC2 security-group configuration and added the rule for SQL Server traffic on port 1433.
- **Ubuntu could not find the Microsoft packages.** I added the Microsoft repository keys and repository source so the required packages were available.
- **The initial SSH connection failed.** The network I was using blocked outbound SSH. I switched to a hotspot to connect to the instances.

## Testing the result

I tested the database directly, then followed the application from searching for a product through submitting a review. The final report includes screenshots of these results:

| Check | Recorded result |
|---|---|
| Query the imported database | `COUNT(*)` returned 504 rows in the product table and 19,972 in the person table. |
| Search the catalog | A search for Mountain-300 returned four matching products. |
| Open a product | The application displayed the Mountain-300 Black, 44 product page. |
| Submit a review | The application displayed a review under my name, with a rating and comment. |

These are results from the completed coursework deployment. The screenshots document the application at that time; there is no current live demonstration linked here.

## Scope and follow-up ideas

The assignment produced a working demonstration of the supplied review application. It used HTTP, and my final report identified HTTPS and user accounts as follow-up improvements. I also proposed allowing reviewers to add photos. Those were recommendations in the report, not features I implemented for the submission.

## Source material

The [final report](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/AdventureWorks%20Project%20-%20Jadon%20Kosberg.docx) brings together the implementation, troubleshooting notes and test screenshots. The [database milestones](https://github.com/jkosber/SVAD-111-Linux-Virtualization/tree/main/Module05) and [web-server milestones](https://github.com/jkosber/SVAD-111-Linux-Virtualization/tree/main/Module07) contain the staged coursework submissions.

The same course also included Bash exercises. My [system-information script](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/VM_Share/m05p2b/ex1.sh) collects uptime, memory, filesystem and network information. A [number-guessing exercise](https://github.com/jkosber/SVAD-111-Linux-Virtualization/blob/main/VM_Share/m05p2b/ex4.sh) works with arguments, integer checks, ranges and user input. These provide additional examples of my Linux scripting coursework.

[Course repository](https://github.com/jkosber/SVAD-111-Linux-Virtualization) · [All projects](index.md)
