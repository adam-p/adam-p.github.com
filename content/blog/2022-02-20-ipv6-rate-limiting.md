---
title: "The scary state of IPv6 rate-limiting"
date: 2022-02-20T13:44:57-05:00
draft: false
tags: []
slug: ipv6-rate-limiting
---

IPv6 rate-limiting is scarily half-baked right now. If you run a server that does any kind of IP-based rate-limiting, consider not enabling IPv6 if possible. If you do use IPv6, check how your rate-limiter actually handles it.

<!--more-->

## Four billion is a pretty small number

Most IPv4 rate-limiters will block individual addresses as they exceed the limit. That's mostly okay, because there are only 4 billion IPv4 addresses. That means a) they are given out with some frugality, and b) it doesn't take much memory to block a large proportion of them. If you and 1000 of your closest friends launch a brute-force or credential-stuffing login attack, any server will have no problem rate-limiting all of you. 

But IPv6 is a very different matter. 

## A gazillion IPs

When you ask your ISP for an IPv6 assignment, you get _at least_ a [/64](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing#IPv6_CIDR_blocks) block -- 2⁶⁴ assignable addresses. [RIPE suggests](https://www.ripe.net/publications/docs/ripe-690) giving a /56 prefix (2⁷² addresses == 256 /64 blocks) to home users and a /48 prefix (2⁸⁰ addresses == 65,536 /64 blocks) to businesses (or "If you want a simple addressing plan use a /48 for each end-user"). [RFC 6177](https://datatracker.ietf.org/doc/html/rfc6177) agrees with this guidance, as does [APNIC](https://blog.apnic.net/2017/07/10/isps-simplifying-customer-ipv6-addressing-part-2/).


Searching for ISPs' IPv6 prefix delegation policies shows that /64[^1] and /56 are pretty common. Internode in Australia [assigns /56 blocks](https://www.internode.on.net/about/our_network/ipv6/) to residential and business customers. In the US, Charter Spectrum also [gives /56s](https://www.reddit.com/r/ipv6/comments/i1b7nk/charter_spectrum_and_ipv6_with_prefix_delegation/). Cogent lets users [request up to /48](https://www.cogentco.com/files/docs/customer_service/faq/ipq_na.txt). (Curiously, Google Fiber reduced their assignment [from /56 to /64](https://www.reddit.com/r/ipv6/comments/9zerb5/google_fiber_now_defaulting_to_handing_out_a_64/).)

So, it's safe to assume that an attacker can obtain at least a /56 and probably a /48. It's also prudent to assume that a determined attacker can utilize all of the addresses at their disposal. And there is at least one [tool that does exactly that](https://github.com/blechschmidt/freebind) -- "freebind: IPv4 and IPv6 address rate limiting evasion tool".

[^1]: Some ISPs also give a small multiple of /64s. But I feel like that case isn't significantly different from a single /64 for our purposes.

## What's the right way to rate-limit a gazillion IPs?

This [StackOverflow answer](https://serverfault.com/a/863511/476142) outlines the best approach I've found:

> The best algorithm is to start blocking separate addresses. Then when multiple addresses are blocked in the same /64 you block the whole /64. Repeat that for bigger aggregates.
> 
> Prefixes are usually given out on nibble boundaries (multiples of 4, or one hexadecimal digit). So you might want to scale from /64 to /60, /56, /52, and /48. A /48 is usually the largest prefix given to a single site.
> 
> Depending how careful you want to be you can skip from /64 straight to /56 and /48.

A comment on that answer has a useful addition:

> You can implement this gradual aggregation approach in a fairly simple way. Track separate rate limits at the /64, /56, and /48 level all the time. Use higher limits for higher levels. That way there is no aggregation logic at all. It's just three separate limits based on different keys. 

(Fun fact: If I google for ["ipv6 rate limiting"](https://www.google.com/search?q=ipv6+rate+limiting) (in a private browsing window), the "featured snippet" at the top is a link to the "rate limiting evasion tool" that I mentioned above. The first normal result is to that SO question. And note that it has only 6 votes and a single answer with only 10 votes. Are people just not thinking/talking about the problem? Or am I searching for the wrong thing?)

## How are real rate limiters actually doing it?

Let's start with [Cloudflare](https://support.cloudflare.com/hc/en-us/articles/115001635128-Configuring-Cloudflare-Rate-Limiting), since it's nice and clear:

> Once an individual IPv4 address or IPv6 /64 IP range exceeds a rule threshold, further requests to the origin web server are blocked 

That's pretty good, though it's missing some of the nuance of the algorithm above. If there's a large non-malicious site (apartment complex, school, business, etc.) behind the /64, the blocking might be over-aggressive. If an attacker has an assignment larger than /64, they might have between 256 and 65,536 /64s at their disposal. The large end of that range is getting big.

AWS WAF supports IPv6 for rules, inspection, and reporting, but doesn't specify how it implements rate-limiting for IPv6. Concerningly, it has a [really small limit](https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html) on the number of IPs it can rate-limit at once: "AWS WAF can block up to 10,000 IP addresses. If more than 10,000 IP addresses send high rates of requests at the same time, AWS WAF will only block 10,000 of them." Unless their IPv6-limiting algorithm is smart, it would be easy for an attacker to ensure they have more blockable units (IPs or /64s) than the limiter can hold. And that means that it would effectively be completely unlimited.

(This raises the question of what the limit on the number of blocked IPs is for other services. I found no such limit mentioned for anything else.)

I also couldn't figure out what IPv6 strategy Google Cloud Armor uses, but [it says this](https://cloud.google.com/armor/docs/security-policy-overview) about its configurable rules: "Both IPv4 and IPv6 source addresses are supported, but IPv6 addresses must have subnet masks no larger than /64." So maybe its rate-limiting is also /64-based, like Cloudflare? Or maybe that's reading too much into a statement that's only tangentially related.

Let's Encrypt [limits account creations by /48](https://letsencrypt.org/docs/rate-limits/), because ["it's not uncommon for one person to have a /48 to themselves"](https://github.com/letsencrypt/boulder/blob/b5b5033136427c988e20ca11f1f7471563f90616/sa/sa.go#L224-L227). That seems very.. cautious. On the one hand, I like how aggressive it is, but on the other hand... there could be 65,536 home or business networks (/64s) in a single rate-limited /48. I feel like this is too coarse-grained for general use.

A year ago, [after a vulnerability report](https://hackerone.com/reports/1154003), Nextcloud changed from limiting IPv6 by individual addresses (/128) to limiting by /64. (There also is/was no size-limiting of the IP cache, [that I can see](https://github.com/nextcloud/server/tree/master/lib/private/Security/RateLimiting/Backend).)

I also looked at a couple of Go HTTP rate-limiting libraries -- [github.com/didip/tollbooth](https://github.com/didip/tollbooth) and [github.com/go-chi/httprate](https://github.com/go-chi/httprate). Neither distinguishes between IPv4 and IPv6 and simply does per-IP blocking. So that's bad. And neither has a size limit on the IPs in its limiter cache (only a time limit), so an attacker can consume all available memory, I think.[^2]

[^2]: After writing this I realized that I'd better be part of the change I want to see, so I submitted PRs to [tollbooth](https://github.com/didip/tollbooth/pull/98) and [httprate](https://github.com/go-chi/httprate/pull/10). Both have been accepted. But it's unlikely that the only two rate-limiting libraries I checked are the only two with this problem, so I don't think this changes the overall point of this post.

(Fun fact: Even a terabyte drive can only store 2³⁶ IPv6 addresses. So you'd need about 270 million such disks to store the IP addresses accessible to a single /64 home user. Or 18 trillion disks for a /48.)

## How many "blockable units" is too many for an attacker?

If a rate limiter is blocking by single IP addresses, then that's the "blockable unit"[^3]. If it's blocking by /64, then that's the "blockable unit". And so on. The rate limiter effectively "allows" an attacker to have a certain number of blockable units at her disposal depending on the limiting strategy used.

[^3]: To be clear, I'm making this term up for convenience of discussion.

The obvious extremes: An attacker having a single blockable unit is acceptable (and unavoidable). An attacker having 2⁶⁴ blockable units is way too many.

But what if the attacker has 256 blockable units (blocking on /64, attacker has /56)? Or 65,536 blockable units (blocking on /64, attacker has /48)?

Let's (charitably) assume that AWS WAF's limit of blocking "10,000 IP addresses" applies to /64s for IPv6. If that's true, then allowing an attacker 65,636 is too many. (To state the obvious, an attacker could cycle through her /64s and never be limited at all.)

Do other WAFs have a size limit that they're not publishing? It seems likely, but not certain. Cloudflare, for example, prides itself on [withstanding the largest attacks](https://blog.cloudflare.com/cloudflare-blocks-an-almost-2-tbps-multi-vector-ddos-attack/) and is surely concerned about state-level attackers with access to at least a /32 prefix -- 4 billion /64s. It would take about 40 GB of storage to keep track of that many prefixes (2³² * (8 bytes per prefix + overhead)). That's not impossible for a big box of RAM, and certainly not for disk, of course (but disk feels a bit slow for this use case). Perhaps Cloudflare is comfortable with blocking that many addresses.

A big box of RAM dedicated to this purpose might be expensive for a smaller operator, but maybe using disk is more acceptable. If we're talking about Nextcloud running on someone's NAS box, then /32 attacks are surely outside of the threat model.

What about 256 blockable units? That's... probably okay?

So, I don't have a great answer to the question of how many blockable units is too many. What's your comfort level? What's your threat model?

And what about an attack that is both distributed _and_ can utilize the full IP space? What _multiple_ of 65,536 (or 256) are you comfortable with?

## Conclusions

I really like the idea of IPv6. I work for a company that would (probably) benefit from widespread IPv6 adoption (so that we're, uh, harder to block). But as I said in the title: If you need to rate-limit access to something, avoid enabling IPv6 for now. The state of IPv6 rate-limiting just seems too immature.

But what if you have no choice? If you're using a web application firewall, try to talk to the vendor about what it actually does. (And then [let me know what they say](mailto:pritchard.adam@gmail.com)!) If you're doing the rate-limiting yourself, look closely at what your code is doing, because there's a very good chance that it's doing it inadequately.

For a quick fix, block IPv6 /64s rather than individual IPs. It might not be perfect, but it's 2⁶⁴ times better.

I remain hopeful that this situation can improve rapidly. Good algorithms tend to get adopted quickly once they become available in a consumable format, and this isn't likely a very complex case. (Yes, I am tempted to implement something myself, but this isn't a problem I personally have right now so I wouldn't actually use my own code, which is never a good starting point.)

## Postscript

The state of this seems so obviously sketchy that I think I must be missing something important. I am still an IPv6 neophyte. Please correct me if I have gotten anything wrong.
