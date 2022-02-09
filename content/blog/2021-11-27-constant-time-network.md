---
comments: false
date: "2021-11-27T00:00:00Z"
published: true
tags: null
title: Timing attack mitigation must exclude network
slug: constant-time-network
aliases: ['constant-time-network']
---

TL;DR: When trying to prevent timing attacks (e.g., against login username enumeration) by making a request take constant time, make sure you exclude the network read and write time. If you don't, an attacker can slow down their request to bypass it.

I'll be covering some background and contextual information here. If you don't need it, skip to "Exclude network time from constant-time limiting".

## What is a "timing attack"?

Briefly, a timing attack (in this context) is when an attacker observes the time it takes for a server to handle a request to glean some information about the validity of the input they tried. The typical target for this attack is the login request, and in that context there are -- unsurprisingly -- two pieces of information that can be attacked: username and password.

Here's a typical login flow, which we'll reference below:

1. Read the request from the client.
2. Parse the request. Check for basic validity.
  - If the check fails, go to step 6, indicating a 400 response.
3. Look up the username in the DB. Retrieve the hashed[^1] password.
  - If the username is not found, go to step 6, indicating a 401 response.
4. Hash the incoming password and compare against the stored one.
  - If the password does not match, go to step 6, indicating a 401 response.
5. Do other work to set up the login session.
6. Write the response to the client.

[^1]: Hashed using something appropriate, like argon2, scrypt, or bcrypt.

### Testing/discovering/enumerating usernames

The time that step #4 takes can be used to test for the existence of a username. If the username isn't found in the DB, the response will come a little faster than if the username is found and then a password hash-and-compare occurs. So an attacker can try out usernames and watch the response time to find out when one exists in the database.

(Note that multiple requests for a single username may be required to nail down the subtle timing differences.)

An attacker might use this for testing variations on a single username to target a particular user, or might use huge common username lists or even brute force to enumerate all or nearly all of your users.

#### Why do I care?

Maybe you don't. Maybe you respond with different information depending on whether the username or password is incorrect, because that's more user-friendly. Maybe your site/service is innocuous, there's no sensitive information, or everything is public. Maybe you're confident that your web application firewall or CAPTCHA or other mitigations will prevent this kind of attack.

_I_ care because [I work on a tool](https://psiphon.ca) that's questionably legal in many countries. Users have a habit of putting their real name in their username or reusing usernames across multiple sites, many of which will connect that username to their real identity. So I -- and we -- think it best that we limit username testing as best we can (and encourage users to [use pseudonyms](https://psiphon.ca/en/faq.html#psicash-pseudonym)).

### Testing passwords

A very bad and wrong way of checking for a password match is to do a simple string comparison on the plaintext password. First of all, you shouldn't be storing plaintext passwords in your DB. Secondly, and relevant to timing attacks, doing a simple string comparison will result in different times taken depending on how many characters in the string match. The string comparison is likely doing a length equality check and then doing a character-by-character equality check, so it's going to return false early as soon as there's a mismatch.

This is a solved problem. Use a library with a proper password-hashing algorithm, and use its constant-time equality function. (And don't just binary-compare the hashes, since the time that takes might also leak something.)

### Other types of requests

"Forgot my password" requests are similarly vulnerable. Typically, the user enters a username or email address, then there's a lookup to see if the account exists and maybe whether the email address is confirmed, then a token gets generated and stored, then the recovery email is sent. As with the login flow, there are processing differences depending on whether the username or email is found or not, which means timing differences that can be used to discover if the input exists in the DB.

The same considerations about caring mentioned above apply here as well.

## Mitigating timing attacks

### Preventing automated requests

Using CAPTCHAs, rate limiting, or a web application firewall can help prevent automated requests that are attempting to enumerate your users. They won't generally help with targeted username testing.

You should certainly employ these kinds of measures, but my opinion is that they should be used alongside other mitigations.

### Randomizing response times (not recommended)

If a random sleep is added to the processing of sensitive requests, then the response timing becomes more difficult to use for timing attacks. But only "more difficult" -- with enough timing samples, the average can be taken and the attack again becomes viable.

### Constant-time responses

We're getting closer to the point of this post now.

Forcing responses to take a fixed amount of time prevents timing analysis. If every response, regardless of input, takes the same amount of time, there's nothing to differentiate and analyze.

The constant time value should be chosen to exceed the possible natural response time. There are likely going to be outliers where the natural response time exceeds the constant time -- you should log and alert these incidents, as they ruin the mitigation. But, generally, if they're kept very infrequent they still won't provide an attacker enough to work with.

Another approach to constant-time excesses would be to have multiple increments of constants. Like, limit the response to 1 second; but if it naturally takes more than 1 second, limit it to 2 seconds; etc. I'm not sure if this is warranted or adds very much. I wouldn't bother. You will also have to be very sure that, say, bad username doesn't always end up in the first time increment while bad passwords always end up in the second.

#### Exclusions

Since we're only trying to prevent an attacker from distinguishing between "bad username" and "good username but bad password", then any situations that don't reveal that can be excluded from having a constant-time response. For example:

* Successful login. The user knows that the username and password were both good, so a constant-time response achieves nothing except slowing down the valid-user experience.
* "400 Bad Request" responses. For example, if the username is too long or has invalid characters in it. No account lookup is done, so nothing is revealed.

It might be tempting to also exclude 500 server errors. In theory, something like a DB communication error shouldn't reveal information about the username or password. But such errors can occur for many reasons, some of which may be repeatable by an attacker. It's probably best to keep server errors constant-time, if possible. (Also, such errors should be extremely rare for benign users and shouldn't significantly impact the experience of the service.)

## Exclude network time from constant-time limiting

We've finally gotten to the point.

When forcing a response to be constant time, the network portion of the request processing must be excluded. By this I mean the time taken to read the request from the client and the time taken to write the response. We'll see that it's both _acceptable_ and _necessary_ to do so.

The login flow will end up looking like this:

1. Read the request from the client.
2. _Record the response start time._
3. Parse the request. Check for basic validity.
  - If the check fails, go to step 7, indicating a 400 response.
4. Look up the username in the DB. Retrieve the hashed password.
  - If the username is not found, go to step 7, indicating a 401 response.
5. Hash the incoming password and compare against the stored one.
  - If the password does not match, go to step 7, indicating a 401 response.
6. Do other work to set up the login session.
7. _Wait until the constant-time limit has passed since the start time._
8. Write the response to the client.

First of all, it is _acceptable_ to exclude the network transfers from the constant-time limit because they are completely unaffected by the validity of the input. Additionally, the attacker controls the network input (the request) and has full visibility of the network output (the response). There is nothing to hide here.

Secondly, it is _necessary_ to exclude the network time.

If the request read time is included in the constant-time consideration, the mitigation is effectively undermined. The attacker controls the client's network speed, so they can trickle the request out until the constant-time limit is passed. Then they start measuring the response time from the point that the request writing is done. The server will then start processing the request. There will be no sleep in step #7 because the constant-time limit has already been exceeded, so the actual processing time will be plainly visible to the attacker.

 (If the "multiple increments of constants" approach is used, the attack is more complicated, but I believe it's still viable. The attacker will need to tweak the request speed so that bad-username requests fall into the first increment while bad-password requests fall into the second. Anyway, this hardly matters, since it's acceptable to exclude the request read time.)

Excluding the response writing time is also necessary. As soon as the first byte of the response is written, the attacker is signaled that the processing is complete and they have the information they need so any constant-time sleeping needs to occur before the response writing is begun.

## Other concerns

I worry about the attacker using a simultaneous request flood to slow down all other request processing enough that many or all login requests will exceed the constant-time limit and start revealing the true processing time. Sufficient capacity and/or scaling, combined with anti-denial-of-service measures should be sufficient to mitigate this. It will also be a pretty expensive -- and therefore unlikely -- approach for an attacker to take.

## Not just HTTP

I wrote the above in terms of HTTP requests and responses, but it applies to any network protocol.

## Final words

I'm writing this because when I was implementing this I screwed up by including the network transfer in the constant-time limit -- it felt cleanest to implement it as middleware, but that was at the wrong level. I only realized the problem while re-reading some tangentially-related code. Hopefully this helps someone else not make the same mistake.

