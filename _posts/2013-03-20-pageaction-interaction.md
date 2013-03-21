---
layout: post
title: No One Knows to Click on a pageAction
tags: [Markdown Here, Code]
published: false
---

## tl;dr

**Page actions** -- the buttons in a browser's address bar -- are a **surprising UI failure**.

When adding a button for a browser extension, a choice must be made whether to make it a "page action" or a "browser action" (button on the toolbar). But **browsers have failed to communicate the interactiveness** of page actions, and **almost no one -- techy or layman -- realizes that they're clickable**. 

---

When adding a button to the [**Markdown Here**](http://www.markdown-here.com) browser extension I had to decide where to put it: in the address bar or on the toolbar.

## Page Action vs. Browser Action

I'm going to use the Chrome extension development terminology: 

<dl>
  <dt><a href="http://developer.chrome.com/extensions/pageAction.html">Page actions (<code>pageAction</code>)...</a></dt>
  <dd>are the buttons and status indicators located in the address/omni/awesome bar.</dd>
  <dt><a href="http://developer.chrome.com/extensions/browserAction.html">Browser actions (<code>browserAction</code>)...</a></dt>
  <dd>are buttons on the browser toolbar.</dd>
</dl>




https://groups.google.com/forum/#!topic/markdown-here/NjQRYcD1mgY/discussion

http://ux.stackexchange.com/questions/33987/browser-extensions-page-action-or-browser-action

https://plus.google.com/u/0/112228900913862544865/posts/9HbUjid2UvV

https://github.com/adam-p/markdown-here/issues/45


![Firefox page and browser buttons](/assets/img/blog/firefox-button.png "Firefox page and browser buttons")
