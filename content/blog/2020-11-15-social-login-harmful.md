---
comments: false
date: "2020-11-15T00:00:00Z"
published: false
tags: null
title: Social Login Considered Harmful
slug: social-login-harmful
---

Using "social login" (e.g., "Login with Google", "Login with Facebook") to register for an online service is more dangerous than using an email (or username) and password to sign up. With caveats.

I have seen at least one [blog post](https://gurjeet.singh.im/blog/never-use-google-to-sign-in) and some [Hacker News comments](https://news.ycombinator.com/item?id=25091420) that make this point, but I haven't seen a very complete explanation of the risks and mitigations, and I think it's worth going into.

## Premise: Big services that give free accounts might taken them away from you at any time, with no recourse

This is the crux of the problem, so we'll start with it. Google, Facebook, Twitter, etc., make money (or hope to) from massive numbers of people signing up for their services. But they don't make enough money from each person to allow for hiring support personnel at a scale proportional to the number of users they have. So they use algorithm-based user monitoring to find users that are violating their rules -- not their published "Terms of Service", per se, but whatever non-publicized rules the algorithms embody. These algorithms cause users to have their accounts locked, there is no explanation given to the user, and _there is no recourse for the user_. Such recourse or remedy would require human intervention and, again, none of these companies are hiring the huge quantities of support personnel needed to deal with the problems of their billion free users.

And people really do lose their accounts in this way. [need to find references] ...

So: Your Gmail or Facebook (etc.) account may be taken away from you at any time, for no reason that you will know beforehand or be able to divine afterwards, and you will have absolutely no ability to get it back. This is not a high probability event, but the cost of it can be so high that you'll probably want to actively avoid it.

## The cost

Losing your primary email account or your Facebook account is obviously horrible, all by itself, for many reasons. But let's get past the anxiety attack that is induced just by imagining that so that we can consider how social logins make it even worse.

Let's say you use Google social login to sign up for Reddit. You collect sweet, sweet internet points and maybe become a moderator of a subreddit. And then you lose access to your Reddit account. And how will your recover it? Not via email. All those internet points are forever gone.

Let's say you use your Apple account to sign up for Bitbucket. You create some repos, write a lot of code. And then you lose access to your Apple account. How will you recover access to your repos?

Let's say you use your Google account to sign up for your Epic Games account. You spend money on games and you have your saves stored in the cloud. And then you lose access to your Facebook account. How will you recover your games?

And so on for every site and service that you used social login to sign up for. I have used my Google account to sign up for about 15 different things. [How about you?](https://myaccount.google.com/permissions)

## Not getting burned



## Mitigation 1: Non-email-provider social login

There are other social login providers besides your email provider.

<img src="social-login-epic-games-signup.png">

Let's say you sign up for Epic Games with your Facebook account's social login. And then, some time later, your Facebook account gets locked. You're not going to be able to log into Epic, but you will still have you email address associated with the Epic account, and that should be sufficient to recover it.

So, using a social login provider that is _not_ also your email provider means that you can still use email as a fallback if your login provider account gets locked.

## Mitigation 2: Username (or email) and password



2FA, password manager


"Google Drive of historical footage locked and flagged as terrorist activity"
https://news.ycombinator.com/item?id=28621412

https://twitter.com/hotgirlhala/status/1385212069679702020


https://news.ycombinator.com/item?id=29428922

https://news.ycombinator.com/item?id=29850665

https://arstechnica.com/gadgets/2022/01/google-tells-free-g-suite-users-pay-up-or-lose-your-account/

Goodreads social login

"I got hacked and Facebook banned me" - https://news.ycombinator.com/item?id=31577325