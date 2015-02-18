---
layout: post
title: Why and How to Use a Contributor License Agreement
tags: [Markdown Here, Code]
published: true
---

Background and Motivation
-------------------------

I received a [pull request](https://github.com/adam-p/markdown-here/pull/232) for Markdown Here that was great: it found a bug, fixed it, and included tests for the fix. However, the PR submitter didn't write the tests using the existing framework, so I figured I'd massage his test code into the proper form.

And then I noticed that he included a [copyright line](https://github.com/adam-p/markdown-here/commit/52cd013413ff4645ed124cef68b5fc9044d65a96#diff-555e8e637d661924e36cdddfba81a23aR9) in the test file. It says "MIT License", which is the license used for the rest of the project, but that got me thinking about what that might mean...

Wikipedia suggests that the [MIT License](http://en.wikipedia.org/wiki/MIT_License) would require me to include his copyright+license notice wherever I use his code. Not a big deal, but annoying. And maybe a slippery slope -- what if I get a bunch more code submissions?

So I did some research into "Contributor License Agreements" and found that there are a couple more things to be concerned about:

If you ever want to change the project license, you have to get the agreement of all contributors. That includes dual-licensing. Good info about that (and CLAs in general), with specific KDE example: ["In Defense of License Agreements"](https://julien.ponge.org/blog/in-defense-of-contributor-license-agreements/).

Patent something something. Contributors retain the patent rights unless explicitly granted in the CLA.

And just to be clear: Contributors have the copyright on their code *by default*, regardless of whether they put the © notice on it. I'm not sure about the license.

So I decided to require MDH contributors to "sign" a CLA. Seemed kind of irresponsible not to.

Picking a CLA
-------------

Spending your weekend reading CLAs is a drag.

I decided to use [Harmony Agreements](http://www.harmonyagreements.org/) to [generate](http://selector.harmonyagreements.org/) the agreement. (I chose "any license" for the "outbound license option".) The agreement it provides seems pretty good and pretty standard.

(Well... when I first generated a agreement I chose the "copyright assignment" version instead of "copyright license". I even committed it and got the pull-request submitter to sign it. But then I re-read it and realized it was a) not very standard, b) maybe not enforceable, and c) kind of heinous. So I changed to the "copyright license" form. The difference is something like "you're transferring absolute power to me and you lose the ability to use your own code" versus "you're letting me do whatever I want with your code but it's still yours" -- exclusive vs. non-exclusive license, kind of thing.)

"Signing"
---------

Ugh. 

Some projects -- like Apache -- require you to print out the agreement, sign it, and mail, fax, or scan-and-email it back to them. Another one (I forget which) uses some Adobe e-signing plugin where you draw your signature on the screen. Google requires you to be signed in, but it's just a button press; ditto Twitter (signed in with Twitter, I mean). [CLAHub](https://www.clahub.com/) requires a Github sign-in (with optional typing of "I AGREE"). I think I also saw some projects that just require a filled-in form. 

CLAHub is really cool. It gives you a nice link for your CLA, collects agreements, and runs a bot that watches your project's PRs, checks against the CLAs, and comments on the PR as to whether the PR-user has agreed yet or not. Except... there's a notice saying it's not ready for prime-time, the bot is broken, and the blog hasn't been updated in a year. Also, entrusting a (flaky?) third party with the agreements seems dangerous (although they can be downloaded, so blah). 

The article I linked above mentions "some [projects] collect agreements through a simple web form (Google Doc is a fine choice)". So I created a Google Form with the CLA and a form for the contributor to provide contact info and indicate agreement. But...

Then I started thinking about non-repudiability. So I did a little reading about [electronic signatures](http://en.wikipedia.org/wiki/Electronic_signature) (not to be confused with digital signatures). Which is a horrible rabbit hole. Anyway, it made me seriously doubt that a row in a Google Spreadsheet with someone's maybe-correct address and the words "I AGREE" really constitutes a legal signature. (Even in the Google and Twitter cases -- how would they prove that they didn't just fiddle some bits to make it look like I signed?)

And if you're going to do this annoying CLA crap then you might as well hope that it means something, right?

Then I found [Medium's open source project](https://github.com/Medium/opensource/blob/master/sign-cla.md). It requires contributors to commit a file along with their pull request stating that they agree to the CLA. That seemed... totally reasonable. The agreement is in-band with the code. In a way that I can't manipulate without invalidating. And much, much less annoying for the contributor than printing/signing/faxing.

So that's how I did it. See MDH's [CONTRIBUTING.md](https://github.com/adam-p/markdown-here/blob/master/CONTRIBUTING.md#contributor-license-agreement). (That's the [filename to use](https://github.com/blog/1184-contributing-guidelines).)

Backlash warning
----------------

Doing the CLA read-and-agree dance is more effort than not doing it. And some people are offended at the idea of doing it (see the tweet at the top of the "In Defense Of" post.) So, it seems unavoidable that a project with a CLA will get fewer contributions than one without -- some people just won't get past that hurdle. 

But it still seems necessary.

---

[Note: This is actually an email I wrote to my co-workers after going through this CLA exercise with Markdown Here. That's why the tone is a bit informal and "blah" is used as if it means something.]
