---
title: "More Than a Password"
date: 2022-10-14T16:31:07-04:00
draft: false
tags: []
slug: password-plus-plus
---

Here's a quick-and-dirty explanation of why two-factor authentication is good, and why U2F/WebAuthn keys (like YubiKeys) are better than the alternatives. (So I have something to point friends and family at.)

<!--more-->

Note that when I use the word "attacker", I don't necessarily mean someone that's specifically out to get you. In fact, it's usually someone trying to crack thousands of accounts at once. This isn't about you being special or not special. You have an identity and some amount of money, so you're a target.

(I use the word "attacker" out of habit -- it's what we use in software/security engineering.)

## Why memorized passwords (by themselves) are super bad

You can't memorize strong passwords, and you certainly can't memorize many of them. So you're going to pick weak passwords and you're going to reuse them between sites.

## Why weak passwords are bad

Attackers are very good at (automated) password guessing. They know the patterns people use (l33tSp34k, book passages, etc.), so it's unlikely that some little trick you use will be effective. They also have the contents of database breaches (see below), so they use common real-word passwords in their attacks (e.g., "password spraying" attacks).

Maybe some of the services you use will be good at limiting the number of guesses at your password that an attacker gets. But others won't be. And an attacker will guess your password on a weak service and then try it on all the others.

## Why reusing passwords is bad

Websites and services get breached all the time. [Go see](https://haveibeenpwned.com/) if you've already been caught in a breach -- you probably have. And those are just the _known_ breaches, and where the contents of the stolen data was made public. (Sign up for the service provided by that site -- getting notified when you appear in a breached database.)

When such a breach occurs and the accounts database is stolen, often the passwords are stored incorrectly and can be extracted. That enables an extremely effective attack: credential stuffing. The attacker -- or anyone else who gets access to the database -- starts using the email or username plus password on every _other_ site of interest.

That means that if you use the same password for Gmail and for the Flyfishing Fan Club site and the latter is breached, your email account will likely be compromised shortly after. And then every account that uses that email address for forgot-my-password recovery.

## Entering passwords by hand is pretty bad

The vast majority of people can't tell the difference between a well-crafted phishing site and the site it's copying. Indeed, usually the site is copied directly and looks identical. Additionally, there are many ways to make a domain name look like another, or just obfuscate it.

Every time you enter a password by hand, you're betting on your ability to correctly guess whether a site is legit or not. There are certainly ways to mitigate this -- visit via a search, browser history, etc. -- but the general danger remains.

If you get phished when trying to log into your email, bank, Facebook, etc., it can be pretty bad, but also keep in mind that even if it happens on an "unimportant" site, you have instantly opened yourself up to credential stuffing attacks everywhere else.

## Use a password manager

Password managers (BitWarden, Lastpass, 1Password, etc.) are great and everyone should use them. They solve the "password memorization" and "password reuse" problems, and partly mitigate "entered by hand" phishing attacks.

The way they generally work is that you memorize (or even write down) one strong password that gets you into the manager... and that's the only password you ever memorize again. You then generate random passwords using the manager, and it stores them. When you need to log in, you get the password from the manager.

Only one password, so no inhuman memorization. A different password for each site, so no more reuse.

The phishing (partial) mitigation comes from the password manager browser extension (I think they all have one). When you're on a site with a properly matching domain then, then the auto-fill option is given. And when you're _not_ on a site with a matching domain name, auto-fill isn't presented. So it's basically doing an exact-match check for you. However... the browser extensions aren't perfect, and it's possible for them to not always show the auto-fill, which means users will get into the (bad) habit of sometimes having to copy from the manager and into the password field, even on legit sites.

(And then there are logins embedded in other sites. That can really mess up password managers _and_ users.)

So, we're in a pretty good place when using a password manager. We just shrug when Have I Been Pwned tells us that the Flyfishing Fan Club site is compromised, because we know that we haven't used the password anywhere else (i.e., nowhere important). And since we're having our password manager generate strong random passwords for us, we're not concerned about guessing attacks on our passwords. (Like, it'll take longer than the age of the universe to guess a 10-random-character password.)

But we're still somewhat vulnerable to phishing attacks. So let's address that.

## We need a second factor

We need another tool to help us close the phishing hole. We need a second factor.

"Two factor authentication" typically refers to "something you know" -- the password -- and either "something you have", like a hardware token, or "something you are", like your fingerprint.

### SMS

Probably the most common "something you have" second factor is in the form of SMS text messages with codes that you need to enter into a site or service after providing your username and password. This is better than literally nothing, but it's not great.

One problem with it is that attackers have become proficient at "SIM hijacking". This allows them to take over your phone number and receive your text messages. Because they're getting the prompt to "enter the code we just texted to you", they know they have the correct username and password, so the extra effort is worthwhile.

But note that it _is_ extra effort for the attacker, and therefore does provide some protection.

The other major shortcoming is that an attacker that creates an effective phishing site can capture your username, password, _and_ the SMS code. Then they'll pass on all three to the target site/service and have access to your account. (There are even open source tools that make doing exactly this very easy.)

So that's not great.

### Time-based codes

Another common form of "something you have" is an authenticator app that spits out time-based codes for a site or service. Cool kids call this TOTP: "time-based one-time password".

This is similar to the SMS approach but better in two ways:

1. No SIM hijacking problem.
2. The time window in which the code can be used is typically smaller, so it again increases the effort. Somewhat.

But... It's still not a full phishing mitigation.

### Hardware keys

U2F (universal second factor), and its successor WebAuthn, is a standard for second factors that actually does completely negate the phishing threat. The implementation of the standard is usually in the form of a slim USB key that has a button on it, but it can vary. The most well-known brand of them is YubiKey.

Let's see if I can describe how it works concisely and coherently...

With U2F enabled, after you log in to, say, Gmail, you are prompted to enter your key and touch the button on it. The browser then sends the domain name of the site you're on to the key, which combines it with some cryptographic junk it stores to produce a code to send back to the Gmail server. Based on information you gave when you registered the key with them, Gmail can figure out if the code is good.

Because a phishing site won't literally be at `gmail.com`, it won't get a code that works for `gmail.com`. So it just cannot get what it needs to complete the login on your behalf, even if it knows your username and email.

(Technical sidebar caveat: An attacker subverts DNS and/or BGP _and_ somehow gets a TLS cert for `gmail.com`, then they can fool your browser and U2F token. But that's catastrophic for everyone, for lots of reasons, and is exceedingly rare. But not impossible.)

These keys even work if you leave them plugged into your computer. (YubiKey even makes ones that are [stubby little things](https://www.yubico.com/ca/product/yubikey-5c-nano/), designed to be left in.) The only loss in security is if the key is physically stolen _and_ the thief also has your username and password. But this kind of in-person attack is much rarer than the huge dragnet attacks that occur across the internet. (And most physical thiefs probably just want to sell your hardware.)

## What about "passkeys"

There are also some password-less authentication methods in the WebAuthn standard. Google, Apple, and Microsoft support (or soon will) "passkeys" that adhere to this standard. Which is cool. I bet they're great and security-strong. But: a) I don't know enough about them yet to say anything useful, and b) until they're supported more widely it's hard to be too excited.

## Why should you care?

Answering the question of _why_ you should care about protecting your accounts seems too tedious to tackle, but at the very least consider: Your email is the skeleton key to your online life, and a lot of "online" life spills over into the rest of your life.

Email is used to recover almost every other kind of account. So if someone hijacks your email, they have the ability to control almost every other account you have. This can cost you _a lot_ -- money, time, etc.

You can probably think of some other services that would be bad to lose control over: Facebook, your bank, anything your business depends on, etc.

## Get a password manager and two YubiKeys

Run -- don't walk -- to get a password manager. Memorized passwords are a ticking time bomb.

The case for second factors isn't quite as convincing, but phishing is still a real and potentially devastating threat. So get two YubiKeys.

Why two? One on your keychain and one where you keep your passports. Maybe one more if you're going to leave it plugged into your computer. Because eventually you'll lose or wreck ([like I did](https://adam-p.ca/blog/2021/06/backup-yubikey/)) the one in your pocket, and want it to be easy to recover.

Why YubiKey? Because they're well-respected and "Made in USA or Sweden". It maybe seems tinfoil-hat-y to worry about where your U2F token is made, but... You don't want an adversarial country to have a copy of the cryptographic keys stored on it.
