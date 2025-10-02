---
title: "Proof of Concept: Hyperlocal Student Budgeting API"
collection: projects
date: 2021-04-15
excerpt: "Prototyped a microservice to provide students with actionable budgeting data by integrating public APIs (Reddit) with federal economic statistics (BLS)."
permalink: /projects/2021-student-col.md
---

This was a self-directed initiative to build a proof of concept for a common problem: the lack of accessible, region-specific financial information for students. The goal was to create a lightweight microservice that could serve up hyperlocal budgeting data on demand.

### The Concept
The core idea was to fuse two distinct types of data to provide a holistic financial picture:
* **Qualitative Community Insights:** I leveraged the Reddit API to perform semantic scraping on personal finance subreddits. This pipeline was designed to extract real-world budgeting tips, savings strategies, and qualitative sentiment from actual student discussions.

* **Quantitative Federal Data:** The system integrated with public APIs from the U.S. Bureau of Labor Statistics. This provided a reliable, quantitative backbone, pulling in official Cost of Living metrics and economic data for specific geographic regions.

### The Architecture
We built a lightweight microservice that could be easily consumed by other student-facing web or mobile applications, demonstrating an understanding of modern, decoupled software design.

### Tech & Skills
* **Core Competencies:** API Integration, Data Scraping, Microservice Architecture, Data Analysis, Python