---
layout: mainpage
title: Adam Pritchard's blog, etc.
name: home
---

# {{ page.title }}

Welcome to my little site. It mostly has software development-related information,
but there's some other stuff here and there. Feel free poke around.

{% for link in site.navigation %}
### [{{ link.text }}]({{ link.url }})
{% endfor %}

### [Markdown Here <i class="icon-external-link"></i>](https://www.markdown-here.com)
