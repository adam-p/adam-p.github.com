---
title: "{{ replaceRE `^\d{4}-\d{2}-\d{2}-` "" .Name | humanize }}"
date: {{ .Date }}
slug: {{ replaceRE `^\d{4}-\d{2}-\d{2}-(.+)$` "$1" .Name }}
---
