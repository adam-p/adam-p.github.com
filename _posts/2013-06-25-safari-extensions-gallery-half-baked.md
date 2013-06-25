---
layout: post
title: "Safari Extensions Gallery: half-baked"
tags: [Markdown Here]
published: true
---

Trying to get [Markdown Here][1] listed in the [Safari Extensions Gallery][2] is by far the worst browser extension "store" experience I've had so far. Shockingly bad.

## No hosting

First of all, but least of all: There's no hosting. Unlike the Chrome and Mozilla stores, the Safari store doesn't host the extension for you -- it's really more of a listing of links to wherever you host your extension files. That's not terrible, but:

- It's costing me a little bit of money each month to host them.
- I don't get nice install/usage stats like I do with Chrome and [Mozilla][3].

## No communication

Submitting the extension was basically the same as everywhere else. But this is the confirmation email:

> Dear Adam Pritchard,  
> Thank you for submitting your Safari Extension.  
> Apple reviews all submissions and reserves the right to omit, edit, or reject any submission. Please note you will not receive any further notifications.  
> We appreciate your interest in Safari.  
> Sincerely,  
> Apple Developer  

(From noreply@adc.apple.com)

So... You're going to review my extension, and I'll never know if it's been accepted or rejected or what? And there's no mechanism for me to get an update?

Sure enough, 5 weeks has gone by now. There've been no status update emails, and there's review status info anywhere on the developer website (that I can find). And I'm not the only one -- there are [other people][4] on the forums in the [same boat][5].

To be clear, this is not at all what the Chrome and Mozilla extension approval process is like. I've had my [fair share of problems][6] with the Mozilla approval process, but I had a queue number, an IRC channel, and reviewers I could communicate with. (The Chrome store has no apparent approval process, because I'm using the standard API. Which is similar to the Safari extension API I'm using. So... why is there any non-negligible review at all?)

## No search

To top it off, the Safari Extensions Gallery itself... has no search?!? Let's pick a not-front-page extension at random... how about the "Entertainment" category and then the Turboglue extension. (Sorry, there's no way to give you a link to that!). Now try to find it some other way. The search box in the upper-right of that page? "No results were found." And... I can't find another search box. (Unlike Firefox, there's no in-browser extension search.) How about a Google site search? That wouldn't really be an acceptable work-around even if it worked... but [it doesn't anwyay][8].

(Maybe related: Here's a [forum post][12] by a dev who has had his/her extension approved, but can't actually find it in the Gallery.)

I'm not sure how this could be worse. Unfriendly to developers *and* unfriendly to users. And it's not like Safari extensions are *new* -- they've been around about the [same amount of time][9] [as Chrome extensions][10].

![Safari Extensions Gallery still marked as new](/assets/img/blog/safari-gallery-new.png "Safari Extensions Gallery still marked as new")

(Screen-grabbed from the bottom of [this page](https://developer.apple.com/programs/safari/). Age of the Gallery derived from [this article](http://lifehacker.com/5598524/whats-useful-in-the-safari-extensions-gallery).)

## Sweet lemons

Safari extensions are clearly not Apple's primary concern, and maybe that's okay. It's not a hardcore-extension-geek browser like Firefox; their browser isn't also an OS, unlike Chrome; and they have guaranteed, bundled-with-OS market share, like Internet Explorer (I don't know much about IE's extension support, but it's clearly not as robust as Firefox and Chrome). And they do give me a way to provide a [Safari extension to my users][11] and update it automatically.

---

## Bonus whinging

It's necessary to generate and register a signing certificate before you can even start to develop a Safari extension (IIRC -- but definitely before publishing). There's no such stumbling block in Firefox and Chrome. Maybe this is due to the absence of hosting? I'm not entirely sure how painful it's going to be to set up a new OS X development machine.

Check out the ghetto method of opening the Markdown Here options page in Safari. It's probably not _just_ my dumbness, since I stole the approach from AdBlock.

![Markdown Here prefs in Safari](/assets/img/blog/safari-mdh-prefs-checkbox.png "Markdown Here prefs in Safari")

[1]: http://markdown-here.com
[2]: http://extensions.apple.com
[3]: https://addons.mozilla.org/en-US/firefox/addon/markdown-here/statistics/?last=365
[4]: https://devforums.apple.com/thread/182373?tstart=0
[5]: https://devforums.apple.com/thread/187144?tstart=0
[6]: https://github.com/adam-p/markdown-here/issues/21
[8]: https://www.google.com/search?q=site%3Aextensions.apple.com+Turboglue
[9]: http://en.wikipedia.org/wiki/Safari_%28web_browser%29#Safari_5
[10]: https://en.wikipedia.org/wiki/Google_Chrome#Chrome_Web_Store
[11]: http://markdown-here.com/get.html
[12]: https://devforums.apple.com/thread/179972
