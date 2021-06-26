---
layout: post
title: "Social Login Considered Harmful"
tags:
published: false
comments: false
---

Using "social login" (e.g., "Login with Google", "Login with Facebook") to register for an online service is more dangerous than using an email (or username) and password to sign up. With caveats.

I have seen at least one [blog post](https://gurjeet.singh.im/blog/never-use-google-to-sign-in) and some [Hacker News comments](https://news.ycombinator.com/item?id=25091420) that make this point, but I haven't seen a very complete explanation of the risks and mitigations, and I think it's worth going into.

## Premise: Big services that give free accounts might taken them away from you at any time, with no recourse

This is the crux of the problem, so we'll start with it. Google, Facebook, Twitter, etc., make money (or hope to) from massive numbers of people signing up for their services. But they don't make enough money from each person to allow for hiring support personnel at a scale proportional to the number of users they have. So they use algorithm-based user monitoring to find users that are violating their rules -- not their published "Terms of Service", per se, but whatever non-publicized rules the algorithms embody. These algorithms cause users to have their accounts locked, there is no explanation given to the user, and _there is no recourse for the user_. Such recourse or remedy would require human intervention and, again, none of these companies are hiring the huge qufantities of support personnel needed to deal with the problems of their billion free users.

And people really do lose their accounts in this way. [need to find references] ...

So: Your Gmail or Facebook (etc.) account may be taken away from you at any time, for no reason that you will know beforehand or be able to divine afterwards, and you will have absolutely no ability to get it back. This is not a high probability event, but the cost of it can be so high that you'll probably want to actively avoid it.

## The cost

Losing your primary email account or your Facebook account is obviously horrible, all by itself, for many reasons. But let's get past the anxiety attack that is induced just by imagining that so that we can consider how social logins make it even worse.



## Mitigation 1: Non-email-provider social login



## Mitigation 2: Username (or email) and password
2FA

