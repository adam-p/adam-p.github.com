---
title: "Should you strip the IPv6 zone?"
date: 2022-03-22T18:32:38-04:00
draft: false
tags: [ipv6]
slug: strip-ipv6-zone
---

There have recently been three different (but related) contexts where I have asked or been asked that question:

1. When a reverse proxy is adding the client IP to the `X-Forwarded-For` header.
2. When the client IP is being used for rate limiting.
3. When checking if a client IP is contained in a configured list of ranges/prefixes/CIDRs.

As I understood more about zones my opinion on this changed. This is an attempt to capture my understanding and where I ended up.

## What are IPv6 zones?

Only link-local addresses have zone identifiers[^1]. The [Wikipedia definition](https://en.wikipedia.org/wiki/IPv6#Link-local_address)[^2] of IPv6 link-local address assignment will get us started:

> All interfaces of IPv6 hosts require a link-local address, which have the prefix fe80::/10. This prefix is combined with a 64-bit suffix, which the host can compute and assign by itself without the presence or cooperation of an external network component like a DHCP server, in a process called _link-local address autoconfiguration_.

[^1]: This is not entirely true. Site-local addresses also used zone identifiers, but they were [deprecated and went out of use](https://en.wikipedia.org/wiki/Unique_local_address#History) about 15 years ago. Also, the "zone identifier" is [sometimes called](https://en.wikipedia.org/wiki/IPv6_address#zone_index) a "zone index".

[^2]: Well, one of the definitions. There's also [a whole entry](https://en.wikipedia.org/wiki/Link-local_address) devoted to link-local addresses.

Link-local addresses are guaranteed to be unique within a "link" -- the subnet or network segment the interface is connected to. They have no uniqueness guarantees beyond that, and are not routed beyond the link they belong to. 

Because a single machine might have multiple interfaces on separate links, there might be peers on those separate links with the same link-local address as each other. In order to correctly address those peers, there needs to be an additional qualifier -- the zone identifier.

In addition to a link-local address, each interface gets a zone identifier. If you list the interfaces on your machine, you'll see link-local addresses like `fe80::2934:e0a2:73b1:80da%21` or `fe80::9105:d0ed:bbda:9935%eth0` -- the part after the percent sign is the zone. 

If you want to connect to the link-local address of another machine you share a link with, it's not enough to know that its IP is `fe80::abcd` -- you also need to know which of your interfaces to connect through to get to it. So the zone-qualified address would be like `fe80::abcd%eth0`. You then have enough information to connect to that machine.

It's important to note that the zone identifier has no meaning outside of the computer that owns the interface. Your IP+zone for a peer machine might be `fe80::abcd%eth0`, but the address that machine has for its own interface might be `fe80::abcd%wifi0` and its address for your machine would then be `fe80::9105:d0ed:bbda:9935%wifi0`.

Link-local addresses may change on reboot (depending on assignment method and the addresses of other peers on the link). Zones probably won't change, since they use either the index or name of the interface (or both), but I don't know if there's a guarantee of that.

I'm not sure if zones are directly modifiable, but it's possible in Linux to change interface names, which should result in a zone change.

## So should zones be stripped?

As [RFC 6874](https://datatracker.ietf.org/doc/html/rfc6874#section-1) says:

> It should be noted that zone identifiers have purely local meaning within the node in which they are defined, often being the same as IPv6 interface names.  They are completely meaningless for any other node.

That suggests that we should be discarding the zone from addresses that are destined for use anywhere other than the machine that added the zone. But, as we've seen, link-local IP addresses are meaningless without the associated zone. So... what's the right answer?

Let's examine the individual contexts I mentioned at the top.

### Adding to the `X-Forwarded-For` header

(I wrote extensively about the [hazards of using the `X-Forwarded-For` header](/blog/2022/03/x-forwarded-for/). I won't be repeating it here so we can stay out of the weeds.)

The main use of the `X-Forwarded-For` header is to get the "real" client IP. A secondary use is to see what path a request took. 

The address being appended to the XFF header is the address of the _peer_ connecting to the machine in question, via its own link-local address. So it'll look like "remote_fe80_ip%local_zone_id".

I think it's better if the link-local address zone is preserved. Without it, we won't know which link the address belongs to, so we won't know which remote machine made the connection.

Of course, it depends on how the XFF values will actually be used. However, that's not always known so it seems better to include more information rather than less.

### Rate limiting by IP

This is partly an extension of the XFF consideration, as that header is often the source of the IP we use for rate limiting.

First of all, let's deal with the possibility of zone spoofing via `X-Forwarded-For`. If we include the zone in the key we're using to rate limit, then the possibility arises of an attacker altering the zone to avoid being rate-limited. I think we can dismiss this concern because if an attacker has the ability to change the zone value, then it will likely be no harder (and probably easier) to change the IP itself.

If we're getting the client IP directly from the socket (rather than a header), then we don't need to worry about spoofing. However, one thing that can go wrong is if the rate-limiting server changes interface names. Then the same client will end up with different "ip%zone" values.

Which leads us to another potential problem: If the rate-limiting DB is shared between multiple servers, then the same client will have different "ip%zone" values for each server, as they'll have different interface names/indexes. The rate limit for a single link-local client will effectively be multiplied by the number of servers.

If we strip the zone, then we lose some specificity, which may result in different machines on different links being rate-limited because they coincidentally have the same link-local IP. While this is true, [the way link-local address are generated](https://en.wikipedia.org/wiki/Link-local_address#IPv6) makes this extremely unlikely. So we can dismiss this as well.

The shared rate-limiting DB case seems more weighty than the others, so my feeling is that it's better to strip the zone.

### Ranges/prefixes/CIDRs

I'll only be considering the "does this prefix contain this IP" use of prefixes (mostly because that's the use I was looking at in this context).

This one seems more obvious: If the user includes a zone in a prefix, then the IP prefix should be respected; if there's no zone in the prefix, then the zone should be stripped from the IP before checking if the prefix contains it.

To make that more concrete:
* With zone: Prefix `fe80::%eth0/10` should contain `fe80::abcd%eth0` but not `fe80::abcd%wifi0`.
* Without zone: Prefix `fe80::/10` should contain `fe80::abcd%eth0` _and_ `fe80::abcd%wifi0`.

What if the prefix contains a zone but the IP has had the zone already stripped? I don't think there's a good answer -- neither "contains" or "does not contain" is entirely sane. So that's another reason not to prematurely strip the zone.

### Additional concerns

There are other factors involved in all of these considerations.

The first is that link-local addresses probably shouldn't be put to any use that requires these considerations. They should probably only be used for low-level automatic network coordination -- any direct use of a link-local address would be better served by a [unique local address](https://en.wikipedia.org/wiki/Unique_local_address). But if you're writing a general-purpose library or reverse proxy you can't just say "well, no one should use them" and wash your hands of it. 

Another consideration is the restrictions imposed by your tools and programming language. For example, I recently [wrote a post](/blog/2022/03/go-netip-flaw/) examining Go's handling of prefixes and IPs with zones. In that case, Go's address prefix types don't support zones at all (in some confusing ways). I suspect that zone handling elsewhere is similarly uneven.

An example of such constraints limiting design is the [Caddy reverse proxy](https://github.com/caddyserver/caddy/blob/79cbe7bfd06565d0e7ab0717119f78960ed54c08/modules/caddyhttp/reverseproxy/reverseproxy.go#L622-L626) stripping the zone [because of](https://github.com/caddyserver/caddy/pull/4507#issuecomment-1075475379) the Go zone-handling limitations.

Finally, another quote from [RFC 6874](https://datatracker.ietf.org/doc/html/rfc6874#section-1):

> Today, [zone identifiers] are meaningful only when attached to addresses with less than global scope, but it is possible that other uses might be defined in the future.

So even if link-local addresses aren't important to you now, it doesn't mean that zones won't be important to you later. (But, yeah, that's hand-wavy and not very compelling.)

### Conclusions

Zones should be kept until the point of use, and then the decision to keep or strip them should be based on the specific use of the IP and ramifications of zones to that use. 

This means that reverse proxies should be including the zone in the `X-Forwarded-For` header, rate limiters should probably be discarding them, and prefix-contains-IP checks should be based on whether there's a zone in the prefix. But these are only examples -- there are myriad uses of IP addresses, and the particular use will dictate (or at least inform) the fate of the zone.

Of course, this is all debatable. To see some other other opinions, check out the few comments I got when I asked about this in the [r/ipv6 subreddit](https://old.reddit.com/r/ipv6/comments/tee1gt/should_zone_identifier_be_in_xforwardedfor_ip/). If you have a differing opinion or know of anyone else having written about this, please let me know.

## Appendix: Checking your own link-local addresses and zones

Windows:
```no-highlight
$ ipconfig
...
Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . : home
   Link-local IPv6 Address . . . . . : fe80::2934:e0a2:73b1:80da%21
   IPv4 Address. . . . . . . . . . . : 192.168.1.11
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
...

$ ping fe80::2934:e0a2:73b1:80da%21

Pinging fe80::2934:e0a2:73b1:80da%21 with 32 bytes of data:
Reply from fe80::2934:e0a2:73b1:80da%21: time<1ms
...

$ ping fe80::2934:e0a2:73b1:80da%nope
Ping request could not find host fe80::2934:e0a2:73b1:80da%nope. Please check the name and try again.
```

Ubuntu (under WSL1 in this case, so same values):
```no-highlight
$ ip address

...
21: wifi0: <BROADCAST,MULTICAST,UP> mtu 1500 group default qlen 1
    link/ieee802.11 64:bc:58:11:a9:f9
    inet 192.168.1.11/24 brd 192.168.1.255 scope global dynamic
       valid_lft 244176sec preferred_lft 244176sec
    inet6 fe80::2934:e0a2:73b1:80da/64 scope link dynamic
       valid_lft forever preferred_lft forever
...

$ ping fe80::2934:e0a2:73b1:80da%21

PING fe80::2934:e0a2:73b1:80da%21(fe80::2934:e0a2:73b1:80da%wifi0) 56 data bytes
64 bytes from fe80::2934:e0a2:73b1:80da%wifi0: icmp_seq=1 ttl=128 time=0.283 ms
...

$ ping fe80::2934:e0a2:73b1:80da%wifi0

PING fe80::2934:e0a2:73b1:80da%wifi0(fe80::2934:e0a2:73b1:80da%wifi0) 56 data bytes
64 bytes from fe80::2934:e0a2:73b1:80da%wifi0: icmp_seq=1 ttl=128 time=0.298 ms
...

$ ping fe80::2934:e0a2:73b1:80da%nope
ping: fe80::2934:e0a2:73b1:80da%nope: Name or service not known
```
