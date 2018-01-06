---
layout: post
title: "Android Non-Vulnerability: Steal a Device and Keep it Unlocked"
tags: [Android, Security]
published: true
---

While poking around in my Android phone's developer options, I realized that **if you steal a phone that's currently unlocked because it's in a "trusted place", then you can force it to remain unlocked forever**. (And then I got schooled about that not being a problem.)


## Security Feature: Smart Lock with Trusted Places

[Android's Smart Lock](https://support.google.com/nexus/answer/6093922?hl=en) allows users to configure conditions under which to keep the phone unlocked. One of the conditions is location -- you can set trusted locations where your phone shouldn't prompt for a PIN/pattern/password when unlocking.

This is a pretty great feature. It's difficult to convince people that the security gained by using a PIN outweighs the inconvenience of constantly entering it. Smart Lock helps mitigate the inconvenience by not requiring the user to constantly enter the PIN at home or at the office.


## Developer Feature: Mock Location

If you're developing a location-aware app, you might want to trick the phone (and your app) into believing that it's somewhere you're not (in a restaurant, near a bus stop, etc.). The Android developer options provide the ability to set a "mock location app". This is a separate app that allows you to configure your desired fake location. When the app is set as the mock location app, the phone pretends to be in the location specified by the app.


## Trusted Place + Mock Location = Perma-Unlock

So if Eve steals Alice's phone from her desk at work, and wants to keep it unlocked until she has more time to peruse it, she can do this:

1. Install a mock location app. Set it to the current location.

2. Enable Developer Options.

3. Select the mock location app in the developer options.

And then Eve walks away, confident that Alice's phone will remain unlocked.

Note that none of those steps requires Eve to type in the phone's PIN. If any of them did, this attack would be nullified. (Adding a Smart Lock trusted location does require a PIN, but fooling the phone into thinking that it's always in the current trusted location doesn't.)

My recommended solution to the Android team: Require a PIN at step 3. If Alice is a developer, there might already be a mock location app installed and the phone will probably already have the developer options enabled. Step 3 seems like the best intervention point.

I also don't like that Smart Lock (and Android Device Manager) respect the mock location. It seems to me that they should be "above" that.

### Bonus attack: Android Device Manager

Alice realizes that her phone is gone! She jumps on her computer and checks [Android Device Manager](https://support.google.com/accounts/answer/3265955?hl=en)! Except... it reports that the phone is still at the office, because it also uses the mock location being reported by the phone.

Hopefully Alice will do a remote lock (or wipe) anyway, or maybe the location confusion slows her down for a while.


## Vulnerability Disclosure

I filed a security issue with the Android team ([#204776](https://code.google.com/p/android/issues/detail?id=204776), but it's not publicly visible). The response was that it is "working as intended".

> Once someone has access to an unlocked phone, they are able to do anything with it (attempt to root the device, install other malware, etc).
>
> We appreciate the report but this is working as intended.

I see what they're saying. In theory, the attacker could enable app side-loading, and then install some kind of data-snarfer service, and then give it sufficient permission to exfiltrate everything it can access. The data-snarfer could run even while the phone is locked.

Or the attacker could just keep touching the screen to keep it unlocked.

(Rooting typically requires a bootloader unlock, which wipes the device. But that's irrelevant if rooting isn't necessary to effect an equivalent attack.)

I'd really like to thank the Android team for taking the time to reply to my not-super-exciting bug report.


## Grand Conclusion

There isn't one. The "Trusted Place + Mock Location" combo isn't a real problem -- it's just a little distasteful. If someone steals your phone and it's unlocked, you'd better hope they're only after the hardware.

This is especially distressing for tablets. Unlike our phone, most of us don't carry our tablet everywhere, so it's much more likely to be stolen from our home. Entering your PIN on your tablet every time is almost as annoying as on your phone, so Smart Lock seems like a good choice. And that means that it's almost certain that your tablet will be stolen unlocked. (If it gets stolen. I have no idea what the likelihood of that is.)
