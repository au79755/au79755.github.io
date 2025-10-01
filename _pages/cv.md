---
layout: archive
title: "CV"
permalink: /cv/
author_profile: true
redirect_from:
  - /resume
---

{% include base_path %}

Education
======
* MSc in Electrical Engineering, University of Illinois Urbana-Champaign, 2024
* BSc in Systems Engineering, University of Illinois Urbana-Champaign, 2023

Experience
======
* Refer to LinkedIn

Papers & Talks
======
  <ul>{% for post in site.publications reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>
  
Teaching & Service
======
  <ul>{% for post in site.teaching reversed %}
    {% include archive-single-cv.html %}
  {% endfor %}</ul>