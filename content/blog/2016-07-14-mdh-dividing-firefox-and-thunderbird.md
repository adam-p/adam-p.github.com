---
comments: false
date: "2016-07-14T00:00:00Z"
published: true
tags:
- MDH
- Markdown Here
title: 'Markdown Here: Splitting the Firefox and Thunderbird Extension'
slug: mdh-dividing-firefox-and-thunderbird
aliases: ['mdh-dividing-firefox-and-thunderbird.html']
---

[This started as notes to myself to help clarify the problem and solution. It's probably more suited to a Github issue than a blog post, and it may get copied into one.]

# The story so far

The Firefox and Thunderbird versions of [Markdown Here](https://markdown-here.com/) both used nearly the same code -- an old-style XUL extension. Tb is only capable of using a XUL extension, while Fx supports at least three extension types: [XUL-based](https://developer.mozilla.org/en-US/Add-ons/Overlay_Extensions/XUL_School), [Add-on SDK](https://developer.mozilla.org/en-US/Add-ons/SDK) (aka Jetpack, aka jpm), and [WebExtensions](https://developer.mozilla.org/en-US/Add-ons/WebExtensions). WebExtensions is the newest, and is essentially an implementation of Chrome's extension API.

I've kept my eye on WebExtensions because it's tempting to be able to use identical code across the many major browsers: Chrome, Firefox, Opera, and Edge(?). It seemed premature to do any real work towards using it as it's not yet fully released, and there would be no perceived benefit to users (it's a more-locked-down extension API, so there would be an imperceptible sercurity benefit).

But... Firefox's multi-process [Electrolysis](https://wiki.mozilla.org/Electrolysis) (E10s) update is nearing release, and [it breaks MDH](https://github.com/adam-p/markdown-here/issues/207). There are two ways to go about fixing this:
1. Figure out what's wrong in the XUL extension and correct it.
2. Switch to WebExtensions.

I tried to figure out why E10s is breaking the XUL extension, but without any success. Maybe I could figure it out if I tried longer/harder? Or maybe not.

I did some testing (and fixing) to make WebExtensions work, and it seems like the best option.

# The big problem: Splitting up Fx and Tb

Until now, the Firefox and Thunderbird extensions were literally the same extension -- I upload a single file to Mozilla and check off the "Firefox" and "Thunderbird" boxes. There is only one extension ID for both. But Thunderbird only supports XUL extensions, so it'll probably be using the XUL version forever.

We clearly have a problem: Fx and Tb will have to use fundamentally different extensions, but right now there's only one extension for both. We're going to have to split the userbase. And it's going to be ugly.

Specifically, it's going to be very ugly for either the Firefox users *or* the Thunderbird users. One platform will receive a message saying, "If you want Markdown Here to keep working for you, uninstall the one you have and go install this other one." (The other platform will see no difference.) Ugh. That's going to cost us some users for sure.

According to the [Mozilla stats for MDH](https://addons.mozilla.org/en-US/firefox/addon/markdown-here/statistics/usage/applications/?last=30), there are two-thirds as many Thunderbird daily users of MDH as Firefox daily users. That makes it somewhat preferable to make life difficult for Tb users rather than Fx users.

However, I think it's Firefox users who will have to jump through hoops. The XUL extension will still work in Firefox to a sufficient degree to show a message to the user. The WebExtensions extension will not work at all in Thunderbird. So existing Thunderbird users simply cannot be given the WebExtensions version, therefore the WebExtensions version must be the new, separate extension. Therefore it's the Firefox users who must suffer.

(A couple of caveats: 1. I have asked in the [Mozilla extension dev forum](https://discourse.mozilla-community.org/t/best-way-to-split-thunderbird-and-firefox-users-because-webextensions/9717) for suggestions for how to do this gracefully; so for I've received one reply, but it's even more painful. 2. I have a terrible feeling that there actually is a graceful way to do this and I'm just not seeing it.)

# The plan, such as it is

1. Get the WebExtensions work done. (Most of the effort now is going to be building the separate versions in a sane way.)

2. Release the brand new WebExtensions version, with a separate ID. (And update the website to point to it, etc.)

3. Release a new XUL version that does nothing but show Firefox users a message telling them what they need to do to upgrade. (And explaining and apologizing profusely.)

4. Watch how many users are lost.

The E10s rollout is supposed to be gradual, so I plan on continuing to support Firefox in the XUL version for the time being, and continuing to show the switch-message when Firefox is detected.

**Outstanding question:** Continue using Addons.Mozilla.Org (aka AMO, aka the main Firefox extension site) or self-host. I've gone through [ridiculous hassle](https://github.com/adam-p/markdown-here/issues/21) getting MDH approved in the past, and I don't want to do it again. Ever. (This is exacerbated by the fact that I'm planning on replacing the Markdown rendering library, and I fear push-back from the AMO reviewers for using a lot of third-party code that's not pre-approved.) The downside of self-hosting is that MDH won't show up in AMO searches, which is surely where a lot of users go when looking for a Firefox extension (versus googling).

(The current Firefox and Thunderbird extension is also used by Pale Moon, which is a Firefox fork, and Postbox and Ice Dove, which are Thunderbird forks. There aren't enough users of them to change any of the rationale, and it [looks like](https://forum.palemoon.org/viewtopic.php?t=6660) Pale Moon [won't be using](https://forum.palemoon.org/viewtopic.php?t=12216) E10s. So there's Firefox, and then everything else.)
