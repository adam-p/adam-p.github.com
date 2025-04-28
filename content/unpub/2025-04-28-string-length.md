---
title: "The best – but not good – way to limit string length"
date: 2025-04-28T14:13:48-04:00
draft: false
tags: []
slug: string-length
toc: true
---

"How long is this string?" should be the easiest question in software development, followed by: "How do I limit the length of this string?" You can -- and should -- look up your programming language documentation for the former; for the latter, the answer takes of the form of: "The easy choice isn't great, and the best choice is only marginally better."

We're going to dive hard into these questions and try to fully grok what we're doing and why.

A TL;DR misses the "fully grok" part, but not everyone has time to read everything, so here are the takeaways:

1. Be aware that there are different ways of measuring string length.
2. Really understand how your programming language stores strings in memory, exposes them to you, and determines string length.
3. Make an intentional decision about how you're going to count characters when limiting string length.
4. Make sure you use that same counting method across all the layers of your architecture.
5. Look carefully at how the "max length" features provided by your language (framework, etc.) actually work. There's a very good chance that they do not match the limiting method you chose.
6. Probably limit by counting normalized Unicode code points. (Like [Google recommends](https://google.aip.dev/210#:~:text=Character%20definition).)

<!--more-->

With that out of the way, let's start our investigation by looking at some of our familiar string length functions:

|            |                 | "a" | "字" | "🔤" | "👨‍👩‍👧‍👦" | "र्स्प" | "x̴͙̹̬̑̓͝͝" |
|------------|-----------------|----:|-----:|------:|-----:|-----:|----:|
| Go         | `len(string)`   |   1 |    3 |   4   | 25   |  15  |  17 |
| JavaScript | `String.length` |   1 |    1 |   2   | 11   |   5  |   9 |
| Python 3   | `len(str)`      |   1 |    1 |   1   |  7   |   5  |   9 |
| Swift      | `String.count`  |   1 |    1 |   1   |  1   |   1  |   1 |

Those four measurements of string length are exemplars of the approaches common to most programming languages: UTF-8 bytes, UTF-16 code units, Unicode code points, grapheme clusters.

## Character encodings and terminology

There are [good explanations](https://tonsky.me/blog/unicode/) of this stuff elsewhere, but let's try to quickly get a handle on the concepts we need to go further. (Feel free to skip anything you're already comfortable with.)

First, a working definition of "**character**": This is the human conceptual ideal of the smallest building block of most written languages[^most-languages]: a letter, an emoji, an ideograph, a punctuation mark, a symbol, a grapheme. Later on we'll also think of these as "if a user types this, they expect a 'character count' to increase by 1". All of the examples in the above table _probably_ look like "a character" to you. (We're going to avoid using this term lightly, in favour of technical correctness, to avoid confusion. So I'm never going to say "Unicode character".)

[^most-languages]: When I make generalizations like this, please remember that I don't actually know what I'm talking about. Maybe many languages consider something smaller than a character to be the atoms? For example, maybe for Japanese kanji it's the radicals or even the strokes? I don't know. This kind of glib generalization is just to give most readers a rough idea as we progress through concepts.

### Unicode

**Unicode** is our attempt to list all possible characters, plus a whole lot more: control characters, non-printable characters, fragments that can be combined to form characters, and so much more.

Each entry in the Unicode space is called a "**code point**" and is represented with a 32-bit unsigned integer, though the actual usable space is only 2²¹ (1.1 million possible values) and only about 150,000 of those values have been assigned. You might also see the term "**Unicode scalar units**" -- these are basically the same as code points, but exclude the reserved "surrogate pair" range.

Examples (character: code, decimal)
- "a": [U+0061](https://unicodeplus.com/U+0061), 97
- "字": [U+5B57](https://unicodeplus.com/U+5B57), 23383
- "🔤": [U+1F524](https://unicodeplus.com/U+1F524), 128292

Strictly speaking, a "Unicode code point" is an abstract concept, with a numerical value assigned to each character. There are 3 common concrete schemes for encoding those code points: UTF-8, UTF-16, and UTF-32. "**UTF-32**" is a direct representation: 32 bits to encode the 32 bits, with endian variants. I'm going to prefer just saying "Unicode code point" for clarity. We'll discuss UTF-8 and UTF-16 at length below.

Note that in Go, a Unicode code point is typically called a "**rune**". (Go [seems to have](https://go.dev/blog/strings#code-points-characters-and-runes) introduced the term for the sake of brevity. I certainly appreciate that, but I'm going to stick with universal terms here.)

### Grapheme cluster

Some Unicode code points can be combined and rendered into a single visual character; we call this a **grapheme cluster**. Sometimes this combined character has its own dedicated code point and doesn't _need_ to be encoded as a multi-code-point grapheme cluster, but sometimes such a character can only be formed that way.

We'll go through some examples, but note that they can get complex.

- "👨‍👩‍👧‍👦": composed of 7 code points
  1. "👨": [U+1F468](https://unicodeplus.com/U+1F468), "man"
  2. zero-width joiner: [U+200D](https://unicodeplus.com/U+200D), HTML entity `&zwj;`
  3. "👩": [U+1F469](https://unicodeplus.com/U+1F469), "woman"
  4. zero-width joiner: [U+200D](https://unicodeplus.com/U+200D), HTML entity `&zwj;`
  5. "👧": [U+1F467](https://unicodeplus.com/U+1F467), "girl"
  6. zero-width joiner: [U+200D](https://unicodeplus.com/U+200D), HTML entity `&zwj;`
  7. "👦": [U+1F466](https://unicodeplus.com/U+1F466), "boy"

The family emoji is an example of a "zero-width joiner (ZWJ) sequence".

Not all possible combinations of emoji (or code points generally) can be combined in such a way to create a single grapheme cluster character; whether and how it's rendered depends on the platform you're viewing it on. (And how it's rendered can change over time. In 2014, with Windows 10, Microsoft introduced the ["ninjacat"](https://www.windowscentral.com/ninjacat-latest-victim-windows-11s-emojigate) ZWJ sequence emoji, combining the "cat" and "ninja" emoji. It wasn't supported by any other platform. In 2021, Microsoft removed support for it and now it renders as two separate emoji.)

There are also "combining marks" that are accents or other fragments that don't require a ZWJ between the code points.

- "é": composed of 2 code points
  1. ordinary letter "e"
  2. "́": [U+0301](https://unicodeplus.com/U+0301), "Combining Acute Accent"

This is an example of a grapheme cluster that can instead be represented with a single code point: [U+00E9](https://unicodeplus.com/U+00E9) is "Latin Small Letter E With Acute" and is visually identical to the above, decomposed cluster. (See "Unicode normalization", below.)

Use of characters formed by grapheme clusters (that can't be normalized away) are extremely uncommon in languages that use European and and East Asian scripts, but fairly common in [South Asian scripts](https://www.w3.org/International/questions/qa-indic-graphemes), like Hindi where ~25% of characters involve a combining mark.

- "र्स्प": composed of 5 code points
  1. "र": [U+0930](https://unicodeplus.com/U+0930), "Devanagari Letter Ra"
  2. "्": [U+094D](https://unicodeplus.com/U+094D), "Devanagari Sign Virama"
  3. "स": [U+0938](https://unicodeplus.com/U+0938), "Devanagari Letter Sa"
  4. "्": [U+094D](https://unicodeplus.com/U+094D), "Devanagari Sign Virama"
  5. "प": [U+092A](https://unicodeplus.com/U+092A), "Devanagari Letter Pa"

[Zalgo text](https://zalgo.org/) abuses combining marks in c̴͚͉͔̓̑͂͜r̷̙̎̎̿͊a̵̜͍̱̋̕z̷̭̰͉͊̎́͒y̵̺̿̔ ways:

- "x̴͙̹̬̑̓͝͝": composed of 9 code points
  1. ordinary letter "x"
  2. "̴", [U+0334](https://unicodeplus.com/U+0334), "Combining Tilde Overlay"
  3. "͝", [U+035D](https://unicodeplus.com/U+035D), "Combining Double Breve"
  4. "̑", [U+0311](https://unicodeplus.com/U+0311), "Combining Inverted Breve"
  5. "͝", [U+035D](https://unicodeplus.com/U+035D), "Combining Double Breve" (again)
  6. "̓", [U+0343](https://unicodeplus.com/U+0343), "Combining Greek Koronis"
  7. "͙", [U+0359](https://unicodeplus.com/U+0359), "Combining Asterisk Below"
  8. "̹", [U+0339](https://unicodeplus.com/U+0339), "Combining Right Half Ring Below"
  9. "̬", [U+032C](https://unicodeplus.com/U+032C), "Combining Caron Below"

As far as I can tell, _there is no limit on the number of code points that can contribute to a single grapheme cluster "character"_. We'll certainly keep that in mind when we think about how to limit string length, below.

(You will sometimes see the word "segmentation" used when talking about extracting grapheme clusters from a string. It generically refers to breaking a string into defined pieces; for example, the JavaScript [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) API can break a string into graphemes, words, or sentences.)

### Unicode normalization

**Unicode normalization** has two functional axes: composition/decomposition and compatibility simplification, resulting in four modes with standard names. The "NF" is "normalization form"; "C" is "canonical composition", "D" is "canonical decomposition"; "K" is "compatibility simplification". Which gives us:

|                   |  No Simplification  |  Simplification  |
|-------------------|:-------------------:|:----------------:|
| **Composition**   | NFC                 | NFKC             |
| **Decomposition** | NFD                 | NFKD             |

**Composition canonicalization** will combine the two-code-point grapheme cluster form of "é" (U+0065 + U+0301) into the single-code-point form "é" (U+00E9); and similar for other grapheme clusters for which an equivalent single code point exists (and does nothing when there is no single code point; e.g., mostly doesn't change Zalgo text). **Decomposition canonicalization** will do the opposite: single-code-point characters will be decomposed into multi-code-point grapheme clusters where and equivalent exists (this includes decomposing Korean Hangul into jamo phonetic components).

**Compatibility simplification** converts some fancy characters into more ordinary ones. For example, "ℍ" (U+210D) and "ℌ" (U+210C) become plain Latin "H"; superscript "²" becomes plain "2". The non-simplifying forms don't replace such characters.

**NFC** is good for keeping a string as compact as possible while ensuring greater consistency.

**NFKC** is good if you want the string to be searchable or otherwise comparable using equivalent characters (like matching "ℍ𝔼𝕃𝕃𝕆" when searching for "HELLO").

I have trouble seeing when the decomposition canonicalization forms would be desirable (at least in a length-limiting context).

Note that accurate normalization is specific to each version of Unicode (of which there have been 16). For example, if the client has version N of Unicode, which added a new combining mark (accent) and normalization rules for composing it to a single code point, but then the client sends the unnormalized version of the string to the server running Unicode version N-1, then the server won't be able to compose the grapheme the way the client expects.

### UTF-8

**UTF-8** encodes code points into a sequence of 1, 2, 3, or 4 one-byte **code units**. It has the very nice property of providing a nicely compact encoding for most string data; in particular, all ASCII printable characters fit in one byte, with the same ASCII numeric value (e.g., if you open an ASCII view of a UTF-8 encoded source file, you can probably read it just fine). It is by far the most common encoding to find serialized to disk or on the wire (in recent years).

Note that there is overhead in the design[^utf8-design], so you don't get the full number of bits to represent code points. Here's how it [breaks down](https://en.wikipedia.org/wiki/UTF-8#Description):

* 1 byte: 7 bits
* 2 bytes: 11 bits
* 3 bytes: 16 bits
* 4 bytes: 21 bits

[^utf8-design]: The overhead enables some cool properties of UTF-8, like: a) The first byte in a UTF-8 code unit sequence tells you how many bytes are in the complete sequence; b) if you look at any byte in a UTF-8 stream, you know exactly where you are in a code unit sequence -- handy if you want to back up or skip to the next sequence after an interruption. UTF-8 was designed by Ken Thompson and is pretty cool.

### UTF-16

**UTF-16** doesn't often get used on the wire or on disk, but it is used in-memory a lot. The reason is that some platforms and languages originally supported **UCS-2**, which is an old 2-byte Unicode standard. When Unicode increased to 4 bytes, UTF-16 was created. It uses 1 or 2 two-byte code units in a code point sequence. The first code unit is identical to and backwards compatible with UCS-2, making the transition for UCS-2 platforms reasonably easy.

(Two UTF-16 code units making a code point is often called a **surrogate pair**. There is also a "surrogate pair" reserved area in the UCS-2 spec that is used to indicate when a second UTF-16 code unit is used in the code point sequence.)

UTF-16 has the nice property that the entire "**Basic Multilingual Plane** (BMP)" fits in a single UTF-16 code unit. That's the "[majority of the common characters used in the major languages of the world](https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-1/)" (but doesn't include emoji, notably). The downside is that it takes twice as much space to represent ASCII characters.

(Note that it takes _three_ UTF-8 bytes to fit the entire BMP.)

### Other encodings

We're not going to get into code pages, WTF-8, CESU, etc. They're not relevant to the task at hand (and I don't know enough to say anything useful).

## String lengths

Now that we understand character encoding better, let's revisit the table above.

| Encoding Count      | "a" | "字" | "🔤" | "👨‍👩‍👧‍👦" | "र्स्प" | "x̴͙̹̬̑̓͝͝" |
|---------------------|----:|-----:|------:|-----:|-----:|----:|
| UTF-8 code units    |   1 |    3 |     4 |   25 |   15 |  17 |
| UTF-16 code units   |   1 |    1 |     2 |   11 |    5 |   9 |
| Unicode code points |   1 |    1 |     1 |    7 |    5 |   9 |
| Grapheme clusters   |   1 |    1 |     1 |    1 |    1 |   1 |

So, different programming languages (and functions within a language) give us different methods of counting. Some examples[^corrections]:

- **UTF-8**: Go, Rust, C++'s `std::u8string`, Haskell's `Text` v2
- **UTF-16**: Java/Android, JavaScript (and TypeScript), C#/.NET (and Windows), Objective-C/iOS (`NSString`), Haskell's `Text` v1.
- **Unicode**: Python 3, Elixir, Ruby, PostgreSQL, Haskell's `Char`
- **Grapheme cluster**: Swift's `String.count` (but it also provides easy access to other encoding lengths), Elixir's `String.length`, Perl 6

[^corrections]: I don't know most of these languages well or at all. Corrections welcome.

Note that many (probably all) languages provide ways of converting between encodings and counting "length" in those other encodings; the above are just defaults. There might also be a difference between which encoding is used in-memory versus which is presented as the main programming interface to access those strings.

To understand how our programming languages of choice deal with string length, it's worth taking a step back and thinking about what a string _is_. The definition of "string" that many of us would give is something like "a bunch of characters". But we've seen now that "character" only has an abstract meaning, so it's not enough to help us when we use a `string` type. We need to know and keep in mind two things:

1. the underlying in-memory representation of strings, and
2. the view into that representation presented to us.

A few examples:

[Go's](https://go.dev/blog/strings) `string` type is really an array of bytes. The intention is that those bytes hold UTF-8 code units, but there's no guarantee of UTF-8 sequence validity. `len(string)` gives the byte length (and so the UTF-8 code unit count) of the string. Go provides `unicode/utf8.RuneCountInString` to get the Unicode code point count. It also has a `unicode/utf16` package for converting between runes (code points) and UTF-16 code units. It has [no built-in support](https://github.com/golang/go/issues/14820) for grapheme cluster segmentation.

JavaScript's `string` type is a set of UTF-16 code units and `string.length` gives you a count of those code units. `[...string]` gives an array of Unicode code points. [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) converts to UTF-8. [`Intl.Segmenter`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) provides access to grapheme clusters.

[Swift's](https://www.swift.org/blog/utf8-string/) underlying representation used to be UTF-16 but has been UTF-8 since 2019. Its `Character` type holds a single grapheme cluster and `String.count` returns grapheme cluster count. To access encodings, it provides [`String.UTF8View`](https://developer.apple.com/documentation/swift/string/utf8view), [`String.UTF16View`](https://developer.apple.com/documentation/swift/string/utf16view), and [`String.UnicodeScalarView`](https://developer.apple.com/documentation/swift/string/unicodescalarview).[^swift-default]

[^swift-default]: I really like this explicit view approach, but I worry about the risks of defaulting to grapheme clusters. Someone should do a survey of projects to see how many are vulnerable to giant-grapheme-cluster attacks. (But not me, since I basically don't know the language at all.)

Having a deeper understanding of how strings work under the hood will help prevent the confusion of discovering that a single emoji has a length of 7, and the bugs that can follow from that confusion.

### Limiting and Consistency

We finally get to the real point of this post!

Because there are 4 different ways to encode characters, there are 4 different ways to count string length. Because there are 4 different ways to count string length, **there are (at least) 4 different ways to limit the length of a string**.

That makes it really easy to be inconsistent across levels of your architecture, leading to bugs and bad user experience. They can be easy to miss in testing, since certain characters and character combinations might be needed to reveal them.

Here are a few length limiters that I was looking at when I decided I needed to write this post:

* Go [validator](https://pkg.go.dev/github.com/go-playground/validator/v10) package (not stdlib, but popular): The `max` and `min` limiters [count Unicode code points](https://github.com/go-playground/validator/blob/859202275556dac82d4460234867c5c5988d06fd/baked_in.go#L2152) ("runes" in Go-speak).
* If you create a column constraint with PostgreSQL's `char_length()`, it'll limit by Unicode code points (with default config).
* The HTML attribute [`maxlength`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/maxlength) on `input` or `textarea` elements limits by UTF-16 code units. (Except... I have found that in IE it limits by Unicode code points instead.)
* React Native's [`TextInput.maxLength`](https://reactnative.dev/docs/textinput#maxlength) limits by UTF-16 code units. This is because [on iOS](https://github.com/facebook/react-native/blob/70cdf12c4d0d27d9fc94645c5779f34d0883320a/packages/react-native/Libraries/Text/TextInput/RCTBaseTextInputView.mm#L501) it uses [`NSString.length`](https://developer.apple.com/documentation/foundation/nsstring/1414212-length) and [on Android](https://github.com/facebook/react-native/blob/402b93dd0cdaf3ae5f4ca557b157904ef98ca31c/packages/react-native/ReactAndroid/src/main/java/com/facebook/react/views/textinput/ReactTextInputManager.java#L781) it uses [`InputFilter.LengthFilter`](https://medium.com/@avinash369/decoding-inputfilter-lengthfilter-df449c19d167).

Rant: It's really annoying that the method of counting length often isn't immediately apparent in the documentation. I should _not_ have had to dig into React Native source code to get the answer. (And this isn't just an RN problem.)

Inconsistencies can arise between frontend clients and backend API servers, between API and database, between different client implementations, between different servers accessing the same database, and so on. Let's look at some problems that inconsistent length-limiting can lead to.

If the frontend allows _longer_ input than the backend (perhaps by the frontend counting Unicode code points while the backend counts UTF-8 or UTF-16 code units), the frontend may indicate that the user's input is valid just to have it rejected by the backend.

If the frontend allows only _shorter_ input than the backend, the user will be unnecessarily restricted. In the case of something like a username, if the account was created in a frontend with consistent counting and then the tries to login on a client with too-short counting, they might be unable to. One can imagine other too-long data might cause a frontend to freak out: assertion failure, refuse to display it, force the user to change it, etc.

Similar problems will occur with length-restrictions at other levels, such as between backend(s) and database.

**Be intentional and consistent with how you limit string length.** Don't just blindly use the default on whatever OS you happen to be on and whatever language you happen to be programming in.

**Problem severity reality check:** _Probably_ allowing this kind of inconsistency won't result in a fatal bug. _Probably_ it won't render your UI unusable or crash your server. _Probably_ it won't introduce an ugly security vulnerability (unless you try to count by grapheme clusters; see below). _Most_ users aren't going to create usernames that are maximum length. _Most_ users won't use characters beyond the BMP in their username (although expect emoji elsewhere). You could _probably_ go your whole career not paying any attention to this and _probably_ not get bitten hard by it. But a) you're curious, and b) you want to limit the margins on "most" and "probably", so let's figure out how to do this better.

### How to limit?

This is the question that really prompted me to write this post: What's the best way to limit string length input?

Let's go through each encoding type again and consider them as candidates for limiting. We'll be thinking about it from both UI and API points of view. Keep in mind that the way you're "limiting" is often different on the frontend versus backend: on the backend, you're probably just rejecting the input (HTTP 400); on the frontend, you're either a) showing the user they've typed beyond the limit and telling them to fix it, or b) preventing them typing beyond the limit, or c) truncating the input.

Let's also make explicit: Usually, the reason we want to limit _count_ is because we want to limit _size_. We don't want infinitely long usernames, chat messages, or even books. Even if we had no trouble displaying them, we don't want to process and store them. Limiting by count rather than byte-size can be more humane, and we'll keep this in mind as we consider approaches.

#### Grapheme clusters

Because they're closest to representing what humans think of as a "character", grapheme clusters seem like they should be the right thing to count. But they're actually the worst because, again, _there's no limit on the number of code points in a grapheme cluster_. Maybe you can use them to limit _count_, but you can't use them to limit _size_. (At maximum "craziness", zalgo.org adorns the letter "x" with 360 accents and whatnot -- for 361 total code points. Swift's `String.count` still, correctly, says that's one grapheme cluster.)

(Perhaps you could limit the number of code points per cluster, but you'd be breaking the Unicode spec and it's probably a bad idea. For something along those lines, see the "Hybrid Counting" section below.)

Grapheme clusters also require additional processing and interpretation. This is more of a rendering problem (e.g., iPhones have had [multiple](https://manishearth.github.io/blog/2018/02/15/picking-apart-the-crashing-ios-string/) crash [bugs](https://www.theregister.com/2013/09/04/unicode_of_death_crash/)), but a complex code path during input validation (potentially before authentication, etc.) should give anyone pause. (But I'm about to recommend Unicode normalization during validation, which is basically the same thing. Also, converting between _any_ encodings requires some kind of "interpretation", but with varying complexity.)

More than the other options, operating at the grapheme cluster level is sensitive to differences between Unicode versions. For example, if a new grapheme cluster is added, a newer segmentation algorithm will count it as 1, while an older Unicode version may count it as the individual code points.

Not all programming languages have built-in grapheme cluster segmentation support. For example, Go has [third-party packages](https://github.com/rivo/uniseg), but [no support](https://github.com/golang/go/issues/14820) in the stdlib or in `golang.org/x/text`.

#### UTF-16 code units

If you're starting from the frontend, there's a good chance that UTF-16 will be your default choice. There are reasons why it's not a good choice.

A danger in length-limiting by counting code units is that you inadvertently break a character by truncating some of code units in a sequence. React Native's iOS limiter [suffered this](https://github.com/facebook/react-native/issues/10929) for at least 5 years before [fixing it](https://github.com/facebook/react-native/commit/f3b8d4976f8608c2cda1f071923f14b6d4538967). It [looks like](https://medium.com/@avinash369/decoding-inputfilter-lengthfilter-df449c19d167) RN's Android limiter avoids this ("If a surrogate pair is encountered at the boundary, it backs off by one character to avoid splitting the pair").

Counting by anything except grapheme clusters means that your count can jump by more than one per "character", which is not the worst thing ever, but obviously undesirable UX. There are two reasons for this jump-counting:
1. Applies to Unicode code points, UTF-8, UTF-16: If the character is a multi-code-point grapheme cluster.
2. Applies to UTF-8, UTF-16: Multiple code units are required to encode the code point.

The first reason can be somewhat mitigated by using NFC normalization with every keystroke -- to the extent possible, that will reduce clusters down to single code points. (Introducing latency while typing is also bad UX! Make sure to test the timing and feel.) We discuss this point more in the Unicode section below.

The second reason can't be mitigated for UTF-8 and UTF-16 -- by design, they can require multiple code units per code point. However, it's _much_ less of a problem for UTF-16, since the whole Basic Multilingual Plane fits in one code unit, though it depends on the type of input expected -- it'll still be a two-count per emoji, at least.

I'm going to reiterate the caveat to that last point: the vast majority of commonly used characters are located in the BMP, and therefore fit in one UTF-16 code unit. Therefore, for the vast majority of commonly used characters, counting by UTF-16 code units is equivalent to counting by Unicode code points. The big exception to this is emoji.

Another big factor is that, while UTF-16 is quite commonly used in-memory, it's very unusual for it to be serialized on the wire or to disk (UTF-8 is used most commonly, rarely UTF-32). Because "size on wire" and "size on disk" are things we care about when limiting, it feels strange to count by the one format that we know won't be serialized. But let's not overstate it: UTF-16 will still get us within about a factor of two of serialized size.

Using UTF-16 maximizes the amount of encoding conversion we're going to have to do.

Additionally, in programming languages that primarily use UTF-8 or Unicode code points, UTF-16 seems to be a second-class. For example, in Go, [strings](https://go.dev/blog/strings) are UTF-8 and runes are what you get when you iterate over a string, but UTF-16 support requires the [`unicode/utf16`](https://pkg.go.dev/unicode/utf16) package. PostgreSQL doesn't seem to support UTF-16 at all.

#### UTF-8

UTF-8 is a tempting choice because a) it's a simple byte count, and b) it's likely what we're serializing to on the wire and on disk. It's also very space-efficient for English text, although less so for other languages.

Counting characters by UTF-8 bytes in the UI is doomed to be confusing. For anything but plain English, the count will regularly increment by 1 or 2 or 3 or 4, and in ways that are not reasonable for a human to predict.

It's important to note that there is a wide range in the significance of a string length limit to the UI/UX. On one end of the spectrum, there are very short fields with visible character counts; an obvious example is the old 140-character tweet limit, which users would stare at while trying to figure out creative contractions that wouldn't obscure their point too much. On the other end is, say, a 10,000-character message board limit, where it's not expected that many users will get near it; probably you don't even bother showing the count, and you just hard-limit the input.

When there's a very high limit, added for sanity and safety's sake, it doesn't really matter how you count characters. You're not exposing the count to the user, and you probably don't care if the limit is 10,000 UTF-32 code points, 20,000 UTF-16 code units, or 40,000 UTF-8 bytes.

But when the count is low and exposed to the user... UTF-8 counting is going to look _weird_.

#### Unicode code points

Argument from authority: Google's [API design guidance](https://google.aip.dev/210#:~:text=Character%20definition) states that string size limits _must_ be measured in Unicode code points, and that those strings should be NFC Unicode normalized.

I think this is approximately the best approach -- not just for APIs, but also for UIs -- but it's certainly not ideal. I would also upgrade the "should" be normalized to "should almost always".

Counting by Unicode/UTF-32 code points means that everything in the Basic Multilingual Plane _and_ many emoji get a count of 1. That's an improvement over UTF-16 (and UTF-8). It also doesn't suffer from the interpretative counting of grapheme clusters.

_But_...

It still suffers from many of the problems mentioned above:

1. It can still count by more than one. Multi-code point grapheme clusters are not uncommon for some scripts (such as Devanagari, used by more than a billion people) and some emoji (such as all [country flags](https://unicode.org/emoji/charts/full-emoji-list.html#country-flag)).

2. Input limiting by code point in a way that isn't grapheme cluster-aware might truncate characters -- causing them to be nonsense or otherwise confusingly incorrect. This isn't hypothetical! I found that React Native on Android (but not iOS) does exactly this.

   <img src="/img/blog/cut-off-flag-grapheme-cluster.gif">

   (The Canada flag emoji is a cluster made of a "Regional Indicator Symbol [Letter C](https://unicodeplus.com/U+1F1E8)" followed by a "Regional Indicator Symbol [Letter A](https://unicodeplus.com/U+1F1E6)", but the length limit is truncating after the "C".)

3. Normalization is needed to limit grapheme clusters, and possibly per-keypress in the UI. Not a big deal, but extra complication and processing.

Even with those caveats, I think counting by Unicode code points is the sanest choice.

#### Hybrid counting

If we were inventing the best possible counting method, what would it look like?

Probably: Grapheme clusters without the unbounded risk.

We would want:

- a count of 1 for each "character" -- even multi-code-point grapheme clusters in scripts like Devanagari
- a count of 1 for each emoji -- even multi-code-point compounds
- more than a count of 1 for technically-a-single-grapheme Zalgo explosions

I think it would be reasonable to do that with logic like:
- For each grapheme cluster:
  - Are there N or fewer code points in the cluster? It counts as 1.
  - Otherwise, it counts as 1 plus the number of code points above N.

What should N be? (Following answer mostly based on this informative [StackOverflow post](https://stackoverflow.com/a/77226692/729729).)

The longest well-defined grapheme cluster I have found is 10 code points ("👨🏻‍❤️‍💋‍👨🏼" -- ["Kiss - Man: Medium-Light Skin Tone, Man: Medium-Light Skin Tone"](https://emojitool.com/en/kiss-man-medium-light-skin-tone-man-medium-light-skin-tone)). So maybe 10 should be our limit.

Unicode defines a [Stream-Safe Text Format](https://unicode.org/reports/tr15/#Stream_Safe_Text_Format), which applies a limit of 30 (post NKFD nomalization). "The value of 30 is chosen to be significantly beyond what is required for any linguistic or technical usage. While it would have been feasible to chose a smaller number, this value provides a very wide margin, yet is well within the buffer size limits of practical implementations." So maybe 30 should be our limit.

(If I understand the Stream-Safe Text Process correctly, it provides a decomposition algorithm that is similar to what I suggested above. However, it would be more generous: a Zalgo character with 100 combining marks under my counting system would get a length of "71" (if N=30); under the Stream-Safe Text Process, it would be broken into 4 pieces. I'm inclined to be less generous, but either approach still provides a bound, which is what we want.)

Even if I think this kind of approach is optimal, I don't think it's perfect.

Each Unicode code point has a theoretical maximum UTF-8 encoding length of 4. So if N=10, we would need to allow 40 bytes for each grapheme count of 1; if N=30, we would need to allow 120 bytes per grapheme. So if, say, we allow 32 characters for a username, we might need 3840 bytes of storage for it (with N=30). That's... a lot?

Many of the problems mentioned above with using grapheme clusters also apply here, including Unicode version concerns.

It's very hard to recommend such a non-standard method of counting for anything that's intended to be consumed externally (e.g., APIs), as it will cause a lot of confusion. Even internally, standardizing that between frontend, backend, and DB would carry a lot of bug risk. So, it would be more feasible if there were a common standard to refer to, code to, and consume, allowing for consistency in understanding and implementation.

And a snappy name. Maybe "graph length".

In the Appendix, I include some implementations of this algorithm.

##### Twitter counting

Twitter uses an interesting hybrid counting method ([docs](https://docs.x.com/resources/fundamentals/counting-characters), [code](https://github.com/twitter/twitter-text/tree/master/js) (Apache licensed)). Here are some examples (using `twttr.txt.getTweetLength()`):

- "a": 1
- "ӑ": 1
- "字": 2
- "🔤": 2
- "👨‍👩‍👧‍👦": 2
- "र्स्प": 5
- "x̴͙̹̬̑̓͝͝": 9

I won't repeat the docs or logic, but generally:
- Many letters and punctuation get a count of 1
- Chinese, Japanese, Korean glyphs get a count of 2
- All valid emoji (even clusters) get a count of 2
- All other code points get a count of 2 each

NFC Unicode normalization is performed before any counting. The API requires UTF-8 encoding.

(Strange: The doc says that "Ồ" ([U+1ED2](https://unicodeplus.com/U+1ED2)) should have a count of 1, but I get 2.)

I like that there's _mostly_ an intuitive rule that's like, "simple characters get a 1-count; complex characters get a 2-count". Except:
1. My use of "simple" sure is Euro-centric
2. The rule doesn't apply to more than a billion people (Hindi writers, etc.)

## Other considerations

There remain important questions and problems that are outside the scope of this post, but I'll mention them here so you can keep them in mind.

### Unicode versions

Older Unicode text is [compatible with](https://www.unicode.org/versions/#Open_Repertoires) newer Unicode versions, but the reverse is not necessarily true. For example, new versions may:

- Add new emoji and other characters (code points)
- Add new valid grapheme clusters, including multi-code-point emoji
- Update grapheme cluster segmentation rules
- Change character normalization rules

Possible problems that could be introduced include:

- If counting by grapheme clusters, there could be a mismatch between frontend and backend, causing them to disagree about whether a string is valid.
- Normalization could be different between frontend and backend, introducing the possibility of string length counting differences.
- A valid emoji entered on one client may not be valid on other clients with older system Unicode versions.
- If there are two different backends with different Unicode versions, they may not normalize a username the same way, resulting in one of them being unable to look it up. (Similarly for passwords. Or any other string matching.)
- If strings are normalized and hashed (e.g., for signing or HMAC) in one place, and then the raw string is sent somewhere else for verification, the normalization may not produce the same string, resulting in a different hash. (So don't try to modify the input before checking. For example, the [JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785#section-3.1-6) specifies that "Although the Unicode standard offers the possibility of rearranging certain character sequences, referred to as "Unicode Normalization", JCS-compliant string processing does not take this into consideration. That is, all components involved in a scheme depending on JCS MUST preserve Unicode string data "as is".")

And so on. (For a real-life story of this kind of version mismatch, [search for "operating system-provided ICU" here](https://hsivonen.fi/string-length/). It also links to a [scary discussion](https://www.postgresql.org/message-id/flat/BA6132ED-1F6B-4A0B-AC22-81278F5AB81E%40tripadvisor.com) about Unicode version differences in glibc causing PostgreSQL index corruption when the same data is used on a different server machine. "No surprise;  I have been expecting to hear about such breakage, and am surprised we hear about it so rarely.  We really have no way of testing for breakage either.  :-(" Yikes.)

I have never seen "Unicode version" be specified as a requirement in an API (or other) spec, but I think it should be, strictly speaking. Otherwise you can't be certain that both sides understand strings in the same way.

On the other hand... This is probably another case of being overly paranoid. At this point in time, Unicode probably isn't changing things so drastically that major breakage is likely.

- It seems grossly unlikely that anyone would be using a brand new grapheme cluster in a username.
- A slight counting difference for a single character (which, while rare, would surely be a lot more likely than many such characters) will very rarely make the difference between "valid" and "too long".
- Most backends (I imagine) don't need to worry about character validity -- they just store the code points. Later they'll send them back to the same client, which will interpret them the way they did before. Mostly. Probably.
- We already accept that different OSes, browsers, and clients don't necessarily render characters or emoji the same way. (I was reminded of this the other day when I sent a coworker the character "𪘀" for testing and was surprised when it didn't render for her. (That's a Chinese character beyond the BMP, in case it also doesn't render for you.))

Lots of "mostly", "rarely", "probably", "unlikely" weasel words, but they multiply together to not really be worth the hassle. Probably.

### Normalization concerns

It might be tempting to have your API require that strings be Unicode normalized _before_ submission, because: a) you're already normalizing on the frontend in order to count the length, and b) it's your API and you make the rules. But I think it's a bad idea.

First of all, you're not going to trust the API-caller to actually do it, so you'll have to do the normalization yourself anyway.

...And then compare your normalized input with the raw input. But then see above for Unicode version concerns -- you could end up in a pathological state where the backend refuses to accept perfectly valid input.

### Encoding errors

Another thing to learn about your programming languages of choice is how they handle bad UTF-8 or UTF-16 encodings, and how you're going to handle that when it happens.

It seems common to replace broken sequences with the [Unicode replacement character](https://en.wikipedia.org/wiki/Specials_(Unicode_block)#Replacement_character), [U+FFFD](https://unicodeplus.com/U+FFFD). E.g., when Go's `json.Unmarshal` encounters a bad UTF-8 code unit sequence, it _silently_ replaces it with U+FFFD.

Should you detect such characters? Treat them as bad input? Or just pass them through?

### Processing overhead

In many cases, accessing (or counting) character encodings other than the one used for natively storing your strings is an O(n) operation. That is, the string needs to be scanned through to answer questions like, "how many UTF-16 code units are in this UTF-8 string?", "how many Unicode/UTF-32 code points in this UTF-16 string?", "how many grapheme clusters?" -- converting from the internal encoding to the target.

For most situations, with most string lengths, this isn't a significant performance problem, but keep it in mind if you're doing this inside a big loop, or with huge data, or in an HPC context.

Swift, for one, [leaves "breadcrumbs"](https://www.swift.org/blog/utf8-string/#breadcrumbs) after the first conversion, to speed up subsequent non-UTF-8 string accesses. I don't know about other languages, but I don't think this is common.

## Additional reading

Henri Sivonen's ["It’s Not Wrong that "🤦🏼‍♂️".length == 7"](https://hsivonen.fi/string-length/) is great. It covers some of the same basics I mention here, but goes into different nerdy things. For example, it looks hard at the density of information relative to character count (and various encodings) in many, many different languages. This gets into the "fairness" of limiting different languages by the different encodings, which I didn't really consider here. (It does this by analyzing the myriad translations of a single document: the Universal Declaration of Human Rights. Smart.)

Nikita Prokopov's ["The Absolute Minimum Every Software Developer Must Know About Unicode in 2023 (Still No Excuses!)"](https://tonsky.me/blog/unicode/) does what it says on the tin. If you feel you want another pass over this stuff after reading this whole post, go there. It also gets into _locale-dependent differences in handling of the same code points_, which is good to know and also troubling.

## Conclusions

What prompted me to write this was when I realized that UTF-16 was the (unstated) encoding used for string length counting and limiting in a project I was reviewing. This felt wrong to me: variable number of code units; not first-class in some languages I cared about; kind of a weird in-between. I also didn't like that the choice wasn't intentional or aware -- it was just whatever the framework used for `maxLength` under the hood.

When I tried to swoop in with some "senior dev has seen it all" shit... I realized that I didn't have a solid suggestion with clear reasons. And that's a good excuse to work them through in a blog post.

One surprising -- to me -- outcome of this research is that UTF-16 isn't actually a _bad_ choice: for most languages, most of the time, only one code unit is needed for a non-emoji character. And it's not like using Unicode code points is a huge improvement: for most languages, most of the time, only one code point is needed, including for most emoji... except, you know, for all those languages (spoken by a billion people) and emoji that make liberal use of grapheme clusters.

I was hoping for a clear right choice, backed by solid reasons, and I didn't find one.

That being said, I think that counting by Unicode code points (with normalization) is the best approach. Did I take 6,000 words to say "just do what [Google suggests](https://google.aip.dev/210#:~:text=Character%20definition)"? Yes, okay, _maybe_, but now I know -- and you know! -- _why_. And that's important. Plus, we got to learn some interesting and somewhat bonkers stuff about things we take for granted every day.

I'll add a TL;DR at the top with takeaway points.

## Appendix: Implement ~~Hybrid Counting~~ ✨Graph Length✨

For fun, let's see what implementations of the "hybrid counting" approach would look like.

JavaScript:

```javascript
/**
 * Counts the number of grapheme clusters in a string, with a sanity limit on the number
 * of Unicode code points allowed in the cluster. After 10 code points in a single cluster,
 * the remaining code points in the cluster are counted as one each.
 * The limit is intended to be larger than the number of code points in in legitimate
 * grapheme clusters (as used in emoji and human languages) from less-legitimate uses,
 * like Zalgo text.
 *
 * @param {string} s  - the input string
 * @returns {number}  - the grapheme length
 */
function graphLength(s) {
  // A bit of research suggests that the locale arugment is ignored for grapheme segmentation
  const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

  let total = 0;

  // Iterate through the grapheme clusters
  for (const { segment } of seg.segment(s)) {
    // Spread … turns the cluster string into an array of Unicode code points
    const n = [...segment].length;

    if (n <= 10) {
      // Short enough to count as one
      total += 1;
    } else {
      // Too long. The first 10 code points count as 1, and the rest each count as another 1
      total += 1 + (n - 10);
    }
  }

  return total;
}
```

Go (using a third-party package that seems like the de facto standard):

```golang
import (
	"unicode/utf8"
	"github.com/rivo/uniseg"
)

func GraphLength(s string) int {
	var total int
	graphemes := uniseg.NewGraphemes(s)

	for graphemes.Next() {
		cluster := graphemes.Str()
		n := utf8.RuneCountInString(cluster)

		if n <= 10 {
			total += 1
		} else {
			total += 1 + (n - 10)
		}
	}
	return total
}
```

Those don't seem terribly hideous. I would consider using that code.

See the Hybrid Counting section for thoughts about using 10 as the count, versus 30.

Whatever your limit, you may wish to add (alerted) logs when you exceed it. If it's just Zalgo, that's fine, but if a new character enters into a common use, then you probably want to know about it and change your limit.

You probably want to NFC-normalize a string before getting its graph length.