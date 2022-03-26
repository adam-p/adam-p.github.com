---
title: "A tiny flaw in Go's netip design"
date: 2022-03-21T18:30:38-04:00
draft: false
tags: [golang, ipv6]
slug: go-netip-flaw
---

Update 2022-03-23: Matt Layher [created a Go issue](https://github.com/golang/go/issues/51899) about this. It's not getting a lot of traction.

---

Does this surprise you? (Try it in the [playground](https://go.dev/play/p/4bHXBiBktUH).)

```golang
prefix := netip.MustParsePrefix("fe80::%zone/10")
addr := netip.MustParseAddr("fe80::1%zone")
fmt.Println(prefix.Contains(addr)) // ==> false
```

Go's new-as-of-1.18 [`netip` package](https://pkg.go.dev/net/netip) is better in every way than the previous `net.IP`, etc., but this one design decision will probably burn someone, somewhere, sometime.

<!--more-->

If you pass a prefix with a zone to the older `net.ParseCIDR` it returns an error. If you pass a prefix with a zone to the newer `netip.ParsePrefix`, it succeeds but silently discards the zone. If you then pass an IP address that is clearly contained by the original prefix -- _including the zone_ -- to `netip.Prefix.Contains`... it returns false!

## Why is it like this?

I learned about this from [a Reddit comment](https://old.reddit.com/r/ipv6/comments/thyhcn/does_it_make_sense_and_is_it_legal_to_have_a_zone/i1by8n5/) by [Matt Layher](https://github.com/mdlayher)[^1] who worked on `netip` (or the original `inet.af/netaddr`):

> For what it's worth, I helped work on the library that ultimately became Go's net/netip and we decided we would remove zones in our CIDR prefix parser because we didn't find any documented usage of a a CIDR like "fe80::%eth0/64" in the wild. 

[^1]: Who super helpfully answered my Reddit question and I'm totally not taking a swipe at him. To be clear, I still think `netip` is great and will be using it wherever I can make 1.18 the minimum Go version.

Which is fair, but I don't think the resulting behaviour is ideal.

## What do the docs say?

The [documentation](https://pkg.go.dev/net/netip@go1.18#Prefix.Contains) for `netip.Prefix.Contains` does make clear the behaviour (emphasis added):

> Contains reports whether the network p includes ip.
> 
> An IPv4 address will not match an IPv6 prefix. A v6-mapped IPv6 address will not match an IPv4 prefix. A zero-value IP will not match any prefix. **If ip has an IPv6 zone, Contains returns false, because Prefixes strip zones.**

It's good that it's documented, but... how many people are going to read the doc for that method? Most people who use it are going to know what it means for a prefix (or CIDR) to "contain" an IP address. And many of us will already be familiar with the older `net.IPMask.Contains`, which has the one-sentence [documentation](https://pkg.go.dev/net@go1.18#IPNet.Contains): "Contains reports whether the network includes ip." And the [doc](https://pkg.go.dev/net/netip@go1.18#ParsePrefix) for `netip.ParsePrefix` says nothing about discarding the zone.

## Why do I care about this fringe thing that no one uses?

I'm writing a [library](https://github.com/realclientip/realclientip-go) that will take a configured list of prefixes/CIDRs/ranges, parse them, and then later check if incoming IPs are contained by them. And whether the IP is contained or not could lead to security-relevant decisions, so the accuracy is important.

With the older `net` package, if the user tried to configure the library to use `"fe80::/10%zone"`, the parsing would fail and there would be an immediate error. If I switch to using `netip`, the parsing will succeed but then the `Contains` checks will return false and the resulting behaviour will be wrong. (The ramifications of that will depend on how the library is being used. It could mean rate-limiting a link-local IP. It could mean using a link-local IP for an access control check where it should instead be an external IP.)

So even though the Go/netip/netaddr team didn't find any instance of a link-local-with-zone-prefix "in the wild", I still need to code (defensively) for the possibility of it.

To be safe I'm going to have to force the `netip` code to behave like the `net` code: return an error from the prefix parsing code if there's a percent sign.

## Bonus: IPv4-mapped IPv6 handling has also changed

As hinted at in the `netip.Prefix.Contains` doc I quoted above...

```golang
prefix := netip.MustParsePrefix("1.0.0.0/8")

// Let's check that it's working as expected
addr := netip.MustParseAddr("1.1.1.1")
fmt.Println(prefix.Contains(addr)) // ==> true

// Now let's try the "IPv4-mapped IPv6" representation of the same address
addr = netip.MustParseAddr("::ffff:1.1.1.1")
fmt.Println(addr)                  // ==> "::ffff:1.1.1.1"
fmt.Println(prefix.Contains(addr)) // ==> false!

// But with the older net.IP and net.NetIP...
_, cidr, _ := net.ParseCIDR("1.0.0.0/8")
ip := net.ParseIP("::ffff:1.1.1.1")
fmt.Println(ip)                // ==> "1.1.1.1"
fmt.Println(cidr.Contains(ip)) // ==> true!
```

(Try it in the [playground](https://go.dev/play/p/ANR5tJEDohN).)

The older `net` code would convert IPv4-mapped IPv6 addresses to IPv4 addresses, with the result that they would be contained by IPv4 CIDRs. The new `netip` code does _not_ convert to IPv4, and the resulting address is _not_ contained by an IPv4 prefix.

I haven't yet thought about this enough to form a strong opinion, but it's good to know.
