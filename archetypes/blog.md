---
title: "{{ replaceRE `^\d{4}-\d{2}-\d{2}-` "" .Name | humanize | title }}"
date: {{ .Date }}
draft: true
tags: []
slug: {{ replaceRE `^\d{4}-\d{2}-\d{2}-(.+)$` "$1" .Name }}
---

<!--more-->
