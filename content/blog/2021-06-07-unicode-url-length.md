---
comments: false
date: "2021-06-07T00:00:00Z"
published: true
tags: null
title: 'Dev Story: Unicode URL length limit blues'
slug: unicode-url-length
aliases: ['unicode-url-length']
---

I have enjoyed reading other people's design and debugging train-of-thought posts, so after I spent two days wrestling with a code problem, I thought I'd write it up. It's not technically exciting, but I think that describing it might be useful to someone -- or my future self -- someday. Or, at the very least, a little amusing.

(Bonus: While writing this I discovered an error I made while doing the actual work. See if you can spot it before I reveal it...)

## Background

### The Psiphon for Windows UI

Our [Psiphon for Windows](https://github.com/Psiphon-Inc/psiphon-windows) client uses an Internet Explorer-based HTML control as the GUI, talking to a C++ backend (which itself talks to the Go implementation of our censorship circumvention tech). It has been working reasonably well for the last 6 years. Before that we had a plain, grey-box, dialog-based win32 UI, but the idea of adding a settings UI and localizing everything prompted me to look for other approaches.

We have strict executable size requirements, because many of our users have limited bandwidth, and because we run an auto-responder that emails our client software -- the Windows and Android clients attached to a single email. That ruled out a lot of fancy UI approaches, but using the native web control ended up working okay. It meant supporting Internet Explorer 7 through 11 as the HTML/CSS/JS engine, so it wasn't always a lot of fun, but manageable. (And Go recently dropped support for Windows XP, which meant we could raise our minimum IE version to 8, which helps.)

For this story, the relevant part of the JS<->C++ communication is that when the JavaScript wants the C++ to start a login sequence, it does something like this:
```js
window.location = 'psi:psicash?{"command":"login","username":"abc","password":"xyz"}'
```

The C++ code gets a window message when the location is going to change and figures out what to do with the URL. (And has the ability to trigger JS functions.)

### PsiCash accounts

Psiphon has an in-app credit system called PsiCash. Users get credit by buying it or by certain rewarded activities. They can spend PsiCash on Speed Boost, which uncaps the network speed and expands the allowed ports.

For the last year I've been working on implementing PsiCash user accounts. Until now a user's PsiCash credit has been tied to a device (or a device's local storage), but accounts will let the user's balance roam across devices, be restored after device failure, and so on.

A PsiCash account has a username and password. The PsiCash server is the ultimate arbiter of what's allowed for the username and password. We use the [PRECIS spec](https://www.rfc-editor.org/rfc/rfc8264.html) for what characters are allowed, which is a pretty wide set (which is important to this story).

We wanted to let the usernames and passwords be pretty long, but we [needed to give them fixed limits](https://dev.to/mitchpommers/password-max-length-limits-are-dumb-but-we-need-them-1dpp). We're allowing 200 bytes for the username and 800 bytes for the password. For the widest UTF-8 characters, that's 50 code points and 200 code points, respectively. (For now let's say that a "code point" is basically what you think of as a "character" or "letter", except not always.)

So, the implementation of accounts is pretty far along at this point, and I'm writing up test cases, and I'm thinking, "I should double-check some of these tests..."

## The problems begin

### Too many bytes

So I put a ton of letters into the username and password fields to see what will happen. And the JS `window.onerror` handler catches this: **"The data area passed to a system call is too small"**, and the C++ side doesn't get the URL message.

Googling for that error doesn't help much. It can happen with [Desktop Bridge](https://techcommunity.microsoft.com/t5/windows-dev-appconsult/desktop-bridge-8211-the-bridge-between-desktop-apps-and-the/ba-p/316488) applications [running on SQL Server](https://support.microsoft.com/en-us/topic/kb4073393-fix-the-data-area-passed-to-a-system-call-is-too-small-error-when-you-start-a-desktop-bridge-application-on-a-sql-server-5ae0994d-023a-d32b-3aad-526500b53993). There are hotfixes or Microsoft Management Console [that can help](https://www.minitool.com/news/the-data-area-passed-to-a-system-call-is-too-small.html). None of those a) seem to apply, or b) are reasonable to ask our users to do.

I found that passing 2020 or fewer bytes was fine, but passing 2022 or more bytes would trigger that error. But passing exactly 2021 bytes... was even worse. It would open a browser tab with a URL that started like <code style="white-space:initial;word-break:break-all">res://ieframe.dll/unknownprotocol.htm#psi:psicash?%7B%22command%22%3A%22login%22%2C%22id%22%3A%22MC4yOTc5MjI5MTY4ODU3MjI4%22%2C%22password%22%3A%2201234567890...</code>. And there's the user's password in the browser address bar! (We'll call this the ">2020 error".)

(This is surely due to [IE having a URL length limit of 2048](https://support.microsoft.com/en-us/topic/maximum-url-length-is-2-083-characters-in-internet-explorer-174e7c8a-6666-f4e0-6fd6-908b53c12246) for GET requests. I didn't think of that at the time, and there was probably some URL overhead I wasn't counting. Anyway, it doesn't change the problem for me.)

Throwing up obscure, non-actionable error messages is bad enough, but the browser tab thing is terrible. So this can't be allowed to happen.

### Tangent: Unicode

If you're not familiar with Unicode and its encodings, you might want to [skip down](#unicode) and read the appendix about it. But here are some quick definitions of terms I'll be using:
* **Unicode**: The system of defining all the letters and characters and emoji and so on. Each Unicode entry has a 32-bit number assigned to it.
* **Code point**: The 32-bit value that indicates a Unicode "character".
* **UTF-8 and UTF-16**: These are the common ways of actually encoding Unicode entries. UTF-8 uses between 1 and 4 single bytes, and UTF-16 uses 1 or 2 double bytes. JavaScript and Windows C++ (`wchar_t`) use UTF-16. Almost everything else uses UTF-8.
* **Code unit**: These are the individual chunks of an encoding -- the single bytes of UTF-8 or the double bytes of UTF-16.

So a single Unicode code point may be encoded by up to 4 UTF-8 code units (4 bytes total) or 2 UTF-16 code units (4 bytes total).

### Limit the input

I hadn't been limiting the username and password input fields because it didn't seem necessary, for reasons like:
* It's important that the login interface allow at least as many characters as the server will allow in the creation of an account.
* The bytes vs graphemes distinction makes things a little murky.
* If we decided to raise the limit on the server side, it'd be nice if the clients just worked.
* If the user enters too many characters... Then they're entering bad credentials, and that's really up to them.

But allowing the user to hit the >2020 bytes error is unacceptable, so I needed to add input limiting. The `<input>` element's [`maxlength` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength) seemed like an easy-and-sufficient way to do that.

`maxlength` is supposed to limit by UTF-16 code _unit_, and does so in modern browsers, which is kind of weird. That means that "🍕" and "𪘀" count as _two_ towards the length. Probably not coincidentally, that's how JS's `String.length` works: `"🍕".length === 2`. There's no mention on MDN or CanIUse of IE deviating from this (that I can find), but it does -- `maxlength` counts code _points_, not code _units_. Which is great! It means I can set `maxlength=50` and get the expected username limiting -- no custom validators required.

But it would still be nice to provide more space for input, because of the reasons I had for not limiting in the first place. So let's do a little math:
```js
// We want to be sure we don't hit the ~2020 limit. Let's say 1900 is a safe maximum.
absolute_byte_limit = 1900
bytes_per_code_point = 4
allowed_code_points = absolute_byte_limit / bytes_per_code_point
==> 475
```

So we have something like a 475 code point allowance to split between username and password. Let's say 75 for the username and 400 for the password (we won't be staying here, so it doesn't really matter).

### Simple change, quick test (famous last words)

So I use my numbered input of `0123456789`, repeated, to fill the max lengths. Works as expected.

Then I try with big long string of "𪘀" and hit the >2020 error. Ugh.

The `<input maxlength="400">` limiter is working, so that's not the problem.

Inspecting the incoming URL on the C++ side reveals the problem: I'm calling `encodeURIComponent` on the query parameters part (after the `?`) of the URL. So each "𪘀" becomes "%F0%AA%98%80". That means the 4 bytes of the UTF-8 (or UTF-16) code point becomes 12 bytes -- there are 3 one-byte characters per byte of UTF-8.

Let's do the math again:
```js
absolute_byte_limit = 1900
bytes_per_code_point = 4 * 3 // 4x UTF-8 code units, 3 bytes per code unit
allowed_code_points = absolute_byte_limit / bytes_per_code_point
==> 158.3
```

So... 158 allowed code points? But we need to allow at least 50+200 code points for the username+password. Time to advance to the next level of problem.

(Disclosure: I have the juice to change the username and password limits. But I don't want to and this seems like a weak reason to do so.)

### The best encoding is no (or little) encoding?

The most obvious thing to try to alleviate the encoding bloat is to just remove `encodeURIComponent`. And it works fine. It appears that the code points are going through as UTF-16 binary -- taking up the minimum possible bytes -- and both the JS and C++ sides were happy.

Then I try a space in the password and it automatically gets encoded as `%20` (the code point for the space character is `U+0020` and so `%20` is the URL-escaped UTF-8-encoded version of it).

That's a bit of a wrinkle, but fine. I could put the URL-decode call back into the C++ code. Except... what if there happens to also be the percent-and-two-numbers sequence naturally occurring in the password? We'll unintentionally be altering it. For example: If the password is `x%41y`, it would get URL-decoded to `xAy`.

After doing some research to satisfy myself that percent-encoding is the only thing going on in URLs, I decide that I only need to percent-encode the percent sign. So the password `x y%20z` becomes `x%20y%2520z` (`%25` being the percent-encoded percent sign) in the URL. URL-decoding will reverse that value properly.

So, yay? We're back to a reasonable number of bytes. Even a password of 50 percent signs (the only thing getting escaped) will still only bloat to 150 bytes.

### But then IE8 strikes

I do all my development on a Windows 10 machine, with IE 11. The installed IE version is what gets used for the web control in the app. IE 11 has a handy developer tool that lets you test in various even-older-IE modes. But it's not always 100% accurate, so sometimes I fire up a [Windows 7 VM with IE 8, 9, or 10](https://developer.microsoft.com/en-us/microsoft-edge/tools/vms/) installed to test for real.

The simple-ASCII-characters-only test works fine in the Win7+IE8 VM. The test with the maximum count of "𪘀" does not.

Again, I inspect the URL coming into the backend (which is a bit harder now, because I don't have a development environment in the VM). And it looks like IE8 is automatically encoding "𪘀" as `\ud869\ude00` (the two-code-unit UTF-16 encoding). Which is _again 12 bytes instead of 4_.

I start getting pretty frustrated at this point.

### When all else fails, base64

So how do I get only ASCII characters in the URL, without bloating by a factor of 3x? How about base64-encoding? That gives us ASCII and a size increase of 33%, which is tolerable.

Let's check the math:
```js
absolute_byte_limit = 1900
bytes_per_code_point = 4 // 2x UTF-16 code units
base64_bloat = 1.33
allowed_code_points = absolute_byte_limit / bytes_per_code_point / base64_bloat
==> 357
```

That gives us an extra 100 code points to play with above our absolute limit of 50+200. Phew!

So, I change the encoding to be `btoa(JSON.stringify(payload))`, with appropriate decoding on the C++ side. Works as expected on Win10.

Doesn't work at all on Win7+IE8. Oh right, forgot, there is no `btoa` in IE8. But we already have a polyfill for that, so I just swap it in and try again.

And, again, the _URL is still too long_. I'm losing my mind a little bit now.

### Re-polyfill JSON

After weeping a little and doing some MessageBox-ing and digging, I realize that the culprit now is IE8's `JSON.stringify`.

Here's IE9, IE10, IE11, and every other browser:
```js
JSON.stringify("𪘀")
==> '"𪘀"'
```
And here's IE8:
```js
JSON.stringify("𪘀")
==> '"\ud869\ude00"'
```

Well that's JUST GREAT.

I think for a few minutes about how encode objects without using JSON, but that's dumb. And then I remember that, until recently, we used a [JSON polyfill](https://github.com/douglascrockford/JSON-js) because we still supported WinXP+IE7 (which doesn't have JSON support). So I try out the polyfill code in the IE8 console and... it gives the desired output! Oh, thank goodness.

So I modify the polyfill code to always replace the native JSON and conditionally include it for IE8.

And test. And it works. Everywhere. For every input.

## Do you see the mistake I made?

And later I decide that maybe this story would be amusing or educational for someone, so I should write up a blog post. And as I'm writing this blog post I realize that I got something wrong. This:

> it looks like IE8 is automatically encoding "𪘀" as `\ud869\ude00`.

Nope. It was JSON doing that, not "automatic encoding". Having encountered the space-->`%20` automatic encoding, I think I was primed to lazily attribute more unexpected behaviour to magic.

Now, with the JSON polyfill replacement, I could go back to just percent-encoding-percent and regain even more code point space in the URL.

I don't think I will, though. I can't shake the question: "Is there anything besides percent-encoding that `InternetCanonicalizeUrl(ICU_DECODE)` (the win32 URL decode function) will try to decode?" If there is, then some user's password will be unusable, and it'll be super hard to diagnose. At the bottom of every email we say, "Psiphon will never ask you for your password", so we can't possibly figure out what's wrong with it!

Fuzzing might be able to find other cases? Or maybe there's source code for `InternetCanonicalizeUrl` that I can inspect (and hope it's the same across Win 7, 8, 8.1, and 10)? But I already spent _way too long_ on this and I can't spend any more. Time to move on.

## This is an edited rendition

This may read like a logical progression of problems, investigations, and (attempted) solutions, but it was so much messier than that. This was my primary task for _two days_ (not my _only_ task, but still).

It was a painful cycle of:
1. Think everything works.
2. Test, expecting success.
3. Get weird results.
4. Debug, usually in VMs with the `alert`-and-`MessageBox` version of printfs.
5. Search for explanations. Read MSDN pages, Wikipedia pages, and anything else that might make it make sense.
6. Think of what to do to avoid the problem. Try stuff. Make it nominally work on Win10+IE11.
7. Repeat.

(You know what didn't help? Running out of disk space while trying to work with VMs.)

There was also much, _much_ more profanity than I have allowed here.

---

<a name="unicode" href="#"></a>
## Appendix: Unicode stuff, as I know it

I am not a Unicode pro, and quite a bit of what I know I learned during this work. I'll give a quick-and-dirty description so we can be on the same page.

So, Unicode is a big list of, like, letters and characters and stuff. Each one gets a 32-bit number assigned to it (although there are only 24-bits actually used). "A" is `0x00000041` (65 in decimal), "あ" is `0x00003042` (12354), "🍕" is `0x0001F355` (127829), "𪘀" is `0x0002A600` (173568). These numbers are often written like `U+0041`, without so many leading zeros.

Those 32-bit Unicode numbers are "code points". Some represent "graphemes" (rendered entities), but some are accents and whatnot that are to be combined with other code points.

(Tangent within a tangent: Some things that you might think of as a single "character", like the "keycap digit one" emoji "1️⃣", are actually "grapheme clusters". In the case of "1️⃣", it's actually a combination of three code points: the usual ASCII number "1", the "VARIATION SELECTOR-16" (`U+FE0F`), and the "COMBINING ENCLOSING KEYCAP" (`U+20E3`).)

So, think of "Unicode" as an abstract list of code points. Then we need to actually encode those code points.

The most direct approach is called UTF-32. It uses 32 bits to encode the 32-bit code point. But the vast majority of code points in common use don't need all 32 bits, so this is a pretty inefficient encoding.

The most common encoding is UTF-8. It uses between one and four 8-bit "code units" to encode a code point. It has the very nice property of encoding English letters, numbers, and punctuation exactly the same as they are in ASCII. If you're encoding text, use UTF-8.

But JavaScript and Windows use UTF-16. It uses one or two 16-bit code units to encode a code point. Some quick [Wikipedia reading](https://en.wikipedia.org/wiki/UTF-16#History) suggests that, once upon a time, 16 bits were thought to be enough for Unicode code points. JavaScript and Windows probably adopted that early (UCS2) spec, and then were stuck with it for legacy reasons. UTF-16 is compatible with that old spec, and here we are.
