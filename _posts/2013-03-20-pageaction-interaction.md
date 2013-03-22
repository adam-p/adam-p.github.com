---
layout: post
title: No One Knows to Click on a pageAction
tags: [Markdown Here, Code]
published: true
---

THIS POST IS STILL A WORK IN PROGRESS

## tl;dr

**Page actions** -- the buttons in a browser's address bar -- are a **surprising UI failure**.

When adding a button for a browser extension, a choice must be made whether to make it a "page action" or a "browser action" (button on the toolbar). But **browsers have failed to communicate the interactiveness** of page actions, and **almost no one -- techy or layman -- realizes that they're clickable**. 

---

When adding a button to the [**Markdown Here**](http://www.markdown-here.com) browser extension I had to decide where to put it: in the address bar or on the toolbar.

## Page Action vs. Browser Action

I'm going to use the Chrome extension development terminology: 

<dl>
  <dt><a href="http://developer.chrome.com/extensions/pageAction.html">Page actions</a> (<code>pageAction</code>)...</dt>
  <dd>are the buttons and status indicators located in the address/omni/awesome bar.</dd>
  <dt><a href="http://developer.chrome.com/extensions/browserAction.html">Browser actions</a> (<code>browserAction</code>)...</dt>
  <dd>are buttons on the browser toolbar.</dd>
</dl>

![Firefox page and browser buttons](/assets/img/blog/firefox-button.png "Firefox page and browser buttons")

In that screenshot you can see the two styles co-existing in Firefox, which suggests there's no real implementation decision to make -- just provide both, and let the user decide which style they like. That's true in Firefox (although there's still a lesser decision there of whether or not to add the toolbar button by default), but in Chrome you can only have a page action _or_ a browser action, but not both.

The choice initially seemed pretty obvious: use a page action. From Chrome's [documentation for browser actions](http://developer.chrome.com/extensions/browserAction.html#tips):

> Don't use browser actions for features that make sense for only a few pages. Use page actions instead.

Markdown Here is on applicable to some rich-edit compose elements (email, mostly), so that admonition seems to apply to pretty directly. Like many people, I'm sure, I don't like occasional-use buttons cluttering up my toolbar. So I implemented the button as a page action.

## Apparently Imperceptible Affordance

...And then I showed the cool new button to my significant other, who said something along the lines of "I can click that?" Which is a pretty damning statement, for a button.

I must admit that I had some suspicions about the obviousness of page actions' clickability. I'm fairly sure it took me a while to realize I could click them, and I'm a) pretty technically savvy, and b) pretty hover-over-everything-that-looks-interesting curious. But if a user is _not_ both of those things...?

So I asked around. I asked in the [Markdown Here Google Group](https://groups.google.com/forum/#!topic/markdown-here/NjQRYcD1mgY/discussion), the [UX StackExchange](http://ux.stackexchange.com/questions/33987/browser-extensions-page-action-or-browser-action), and on [Google+](https://plus.google.com/u/0/112228900913862544865/posts/9HbUjid2UvV). These are the sorts of responses I got:

* "This purely anecdotal, but I work in the web industry, and use chrome everyday, and didn't realise the page actions were clickable. I agree with you that they look more like signifiers than they do clickable buttons."
* "But I agree that they don't function well as buttons, perhaps this is by the design of the icon (not "raising" the element to give it depth)."
* "pageAction in the abstract is a great idea, but I always find its use a little jarring. And I agree it's not button-like at all, more just informational."

(Yes, there were some people who knew that page actions are clickable. But the fact that many computer/tech/web/UX-savvy people *didn't* know is the more significant observation.)

I also asked around among people at the office (coders) and among non-programmer friends, and the vast majority of both groups didn't know they could interact with page actions. At best they thought of them as status indicators, and at worst they couldn't remember ever having noticed them before. *Ugh*.

### Missing Cues

It's hard to blame users for this lack of [affordance](http://en.wikipedia.org/wiki/Affordance) recognition. At least, not yet.

Page actions do not display any of the typical this-is-a-clickable-thing traits. For the most part, page actions:

* are not raised or underlined, like a standard button or a link, so most people won't hover over them, but even if the user does hover, page actions...
* do not change at all when hovered over -- no outline, no colour change, no raise-up, no clicky mouse cursor.

Some page actions have a verb-based tooltip if you hover long enough. *Some*. *If*. *Long enough*. 

It's a little shocking how poorly the interactiveness is communicated to the user.

### Maybe the kids will get it?

<!-- dropping into HTML to float the image, since it's so vertical -->
<a href="/assets/img/blog/windows8-clickable.png">
  <img src="/assets/img/blog/windows8-clickable.png" title="Windows 8 clickable text" alt="Windows 8 clickable text" class="pull-right" style="max-height: 20em; margin-left: 2em;">
</a>

Above I coyly dropped "At least, not yet." There is a trend in UI design towards everything on-screen being interactive unless explicitly disabled-looking. Windows 8 has gone this way, as has Chrome and, to a slightly lesser extend, Firefox. There's very, very little text or window chrome that's non-interactive. 

But even if you accept the everything-is-interactive ideal, page actions are still different than most other elements, since there's no hover effect. And page actions are further hampered by the minimalistic design aesthetic that Chrome and Firefox seem to have adopted for them -- a monochrome outline icon that can easily be read as disabled.

Maybe once users have fully embraced/internalized the idea that there are no extraneous UI elements, they won't need hover effects and raised borders. Maybe there'll be a great awakening to the utility of page actions. But until then...

## Back to Browser Action

So I switched the Chrome button to be a browser action. 




https://github.com/adam-p/markdown-here/issues/45


Mention that Pocket went with browserAction
