---
comments: false
date: "2021-11-28T00:00:00Z"
draft: false
tags: null
title: The Ethics of Driving Speed in Travel Time Estimation
slug: ethics-travel-time
aliases: ['28/ethics-travel-time.html']
---

How should travel time be estimated? What are the ethical implications of the approach taken?

You enter your destination into your maps app. It finds a few likely routes. It determines the distance of each pretty easily. It checks traffic conditions along the routes. But we don't yet have a travel time estimate. Time equals distance divided by speed, adjusted for traffic.

What travel speed (traffic notwithstanding) does the app use?
1. The speed limit along the route.
2. The speed at which the app user typically drives along the route.
3. The speed at which other motorists typically drive along the route.

We'll set aside option #2 for now. There are many cases where the user has never made the trip that they're planning. We'll discuss an expanded version of it below.

The problem with picking between the other two options is that a) most people drive above the speed limit[^1] and b) doing so is breaking the law.

If we use the speed limit method and our user drives the speed limit, our estimate is good. But most people drive faster than the speed limit, so our estimated time will typically be too high. The user will leave earlier than they need to, drive faster than we estimated, and arrive earlier than they intended to.

If we use the typical speed method and our user drives the typical speed, our estimate is good. But if our user is in the minority of law-abiding motorists, we underestimate their travel time and the user arrives late.

So there's the quandary: The speed limit method is incorrect for most people and the typical speed method encourages illegal behaviour and punishes law-abiding drivers (by making them late).

I think that the speed limit approach is more ethically palatable, because it encourages legal behaviour and because being early is almost always better than being late. But giving travel time estimates that are usually incorrect is extremely unappealing -- your maps app isn't very good if one of your fundamental features is usually wrong.

So what do maps apps do and what should they do? To be clear, I know nothing about this domain. I own a car and a cell phone and that's the extent of my qualifications. But we can have fun thinking about it...

One approach could be to split the difference. Give a time estimate in between the speed limit and the speed people usually drive. This doesn't feel great because a) it's still usually going to assume an illegal speed, and b) it's still likely to be incorrect for many people. Nevertheless, I feel like it's probably a good approach. It still errs on the side of being early, is closer to being correct for more people than the speed limit approach, and will result in a smaller speeding fine if followed closely.[^2]

It's also worth mentioning that below a certain speeding threshold, the probability of getting a ticket approaches zero. (Though this claim is confounded by automated systems, like speeding cameras.)

Another approach is to reintroduce option #2 from above, with some extra magic sprinkled on top. The app may not have seen the user drive the exact desired route before, but it has likely seen the user drive similar roads with similar speed limits and can make a very good guess about how fast the user will actually drive.

This is a very nice approach. It results in the most accurate predictions for the most users. And it largely allows the app developers/ethicists (probably one and the same) to wash their hands of the charge that they're requiring people to break the law to avoid being late. If the user was law-abiding, they'd get law-abiding directions!

(For the brief amount of time before there's any data about the user... probably keep it clean by giving a speed-limit estimate.)

I don't know what apps really do. After messing around with Google Maps for a while I managed to [find a route](https://goo.gl/maps/8bjzqbrAkTg1QXh56)[^3] that seems to encourage breaking the speed limit.

![Google maps travel time estimate showing 9 minutes for 16.4 kilometers](/img/blog/401-travel-time.png)

16.4 kilometers in 9 minutes is 109 kilometers per hour, and the speed limit on highway 401 is 100 km/h. But... if that 9 minutes is rounded down from 9.9 minutes, then the speed drops to 99.4 km/h. And it did take me about 10 tries to find a route that exceeded the limit. (I hunted in the Toronto area because I know the speed limits, but there are probably much better, longer, traffic-free stretches elsewhere that would be better experiments. Except now it's snowy everywhere that I know, and that will also surely factor into estimates.)

Is it okay for a maps app to encourage us to ever break the legal speed limit, even if our previous behaviour -- or the behaviour of others on the same stretch of road -- indicates that we likely will anyway?

Even seemingly mundane automated systems can have ethical impacts. As consumers of such systems we need to be cognizant of what behaviours such systems are pushing us towards (and away from), and we should get in the habit of consciously and explicitly asking ourselves how we're being influenced.

For those of us who are developers of such systems, we need to make a habit of consciously stepping back and thinking about the impact of our design decisions on our users. What's optimal might not always be what's ethical. And for any non-trivial ethical question, it should be discussed with others. It's difficult to see the ethical traps in one's own design and even harder to find better ways out of them -- the perspective of others is invaluable.

Disclaimer: As I said above, I have no domain knowledge here. I did some googling to see if there was discussion or papers about this and found nothing, but it's entirely likely I wasn't searching for the right words.

[^1]: This might not be true everywhere, but it sure is where I live.

[^2]: There's also a conversation worth having about the immorality of breaking the law to speed. And if the moral violation is lesser or greater depending on how badly you exceed the limit, or if being in sin is a binary state. Not a conversation I particularly want to have here, with myself, though.

[^3]: Using a [longer link](https://www.google.ca/maps/dir/43.8049634,-79.133491/43.8671479,-78.9525895/@43.7902468,-79.1002391,12.33z/data=!4m2!4m1!3e0) in case that shortened one breaks.
