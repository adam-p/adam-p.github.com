---
title: "Git Submodule vs Subtree"
date: 2022-02-17T21:35:37-05:00
draft: false
tags: []
slug: git-submodule-subtree
---

Every now and then I need to make a choice between using git submodules or subtrees (or nothing), or I get asked about them by coworkers. This is infrequent enough that I forget some of the details each time and need to refresh my memory. So I wrote up these notes to share with my coworkers and to help my future self. Hopefully they’re of some use to others as well.

<!--more-->

Disclaimer: My experience still isn’t large. I’ve only used each once or twice. And this isn’t a manual for using those commands/tools -- it’s just a concise aid for choosing between them.

TL;DR: Subtree is better if you basically want to forget you have external code, or only infrequently update it; submodule is better if you _don’t_ want to forget that the code is external, and/or if you maybe want to edit and push it.

I’d seen a lot of complaining about submodule during research, and had the vague idea that subtree was “better”, but I’ve come to realize that submodule has its place.

When you use subtree, you’re basically copying a remote code base into your file structure. The auto-commit comment at the moment you do it will record the remote commit hash, but otherwise there’s no indication anywhere in the repo that a) the subtree happened, b) what the remote repo was, or c) what the commit of the remote repo was.

From then on, any changes to the subtree code will be treated just like changes anywhere else in the repo. Any operations to `git subtree push` and `git subtree pull` the code does weird git directory slicing (which I’ve used before to create a new repo from the subdirectory of an existing repo, retaining commit history for the files in that directory). It’s okay, but clunky.

This is in sharp contrast with submodule, where the remote repo code is _not_ copied. Instead, the remote repo URL is recorded, and its location in the file structure, and the remote repo commit to use. When you clone the repo, you have to separately clone the submodule dependency(ies) (`git submodule init`+`git submodule update` or `git clone --recurse-submodules`). The submodule becomes a separate repo in the file structure, with its own `.git` dir. For example, if you do `git status` in the submodule directory, it tells you the status of the submodule code and not the outer repo. If you update the submodule repo directory, it changes the submodule's tracked commit in the outer repo, and you commit that in the outer repo.

Treating the submodule as a separate entity is easy. You can just do all your usual branching, committing, pushing (the remote is the subrepo remote, not the outer remote).

Cloning the subtree is easier because there’s no separate step, but that's not a big deal. For vendoring 3rd party code, submodule won’t actually make a copy, so that’s not okay[^1] (unless you fork the 3rd party code first and submodule the fork).

So the main decision factors are like:
* Use **subtree** when you just want to copy code from an external repo once, or maybe with occasional pulls.
* Use **submodule** when you want to make your relationship to the external repo really explicit, or if you intend to make changes to the submodule code from within the context of your repo and push to the external repo.

[^1]: Depending on your vendoring policy and the dependency management system.
