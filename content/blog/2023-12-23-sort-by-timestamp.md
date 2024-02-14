---
title: "Bug story: Sorting by timestamp"
date: 2023-12-23T10:22:41-05:00
draft: false
tags: []
slug: sort-by-timestamp
---

While reviewing a co-worker's results-paging design I realized there was a bug in some paging code I wrote[^codeauth] a few years ago. It's unlikely to manifest and kind of subtle, but I thought that describing it here might be useful to others writing such code (including my future self). It comes down to sorting by timestamp...

[^codeauth]: The implementation was part of a big change that got squashed -- a practice I am having doubts about -- so I don't know for sure if I wrote it. It was years ago! But I certainly reviewed it, and didn't know better, so I'm still taking the blame here.

<!--more-->

We'll start with a table like this:
```sql
CREATE TABLE item(
  id TEXT PRIMARY KEY DEFAULT generate_unique_id(),
  created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- plus other stuff not relevant to the story
```

Note that we don't have anything like a `SERIAL` column[^randpk], so `created` is our only option for traversing records chronologically.

[^randpk]: For reasons. We need a random primary key.

Our clients will request pages of those items, persist them locally, and later check to see if there are new items. The paging query looks very generally like this:

```sql
-- last_known_id is input
SELECT * FROM item
WHERE created > (SELECT created FROM item WHERE id = last_known_id)
ORDER BY created ASC
LIMIT 10
```

This approach would be fine if these properties were true (per user):
1. The creation timestamp is unique
2. The creation timestamps are monotonically increasing

When writing the code I unthinkingly took those to be the case. But when I took the time to think about it a few days ago, I quickly realized that they're bad assumptions. Let's look at some problems with them...

PostgreSQL's [timestamp type](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME-TABLE) has microsecond resolution[^timeprovider]. That's really small, but not infinitely so. It is surely theoretically possible to create more than one record with the same timestamp, even for the same user with cross-transaction serialization constraints. (It probably requires a transaction to begin and commit within a millisecond, but that's not enough to discount it.) This becomes trivially true if your DB operations don't have cross-transaction constraints.

[^timeprovider]: A [commenter on HN](https://news.ycombinator.com/item?id=38747686) pointed out that the resolution of the timestamp might be coarser than microsecond if the resolution of the service providing time to Postgres is coarser. _Probably_ it's not coarser, but it's another thing to not take for granted.

From what I can find, Postgres does not provide a guarantee of stable sort for identical values. Based on what (little) I know about b-tree indexes, I think it's probably true for indexed values (unless some other index type gets used? unless the index gets rebuilt or shuffled?), but it's still not something that should be (sanely) relied on.

What happens to `now()` if the OS clock gets adjusted backwards (perhaps due to NTP update, assuming slew isn't used[^slew])? If it goes backwards, then we lose monotonicity. But even if it doesn't update until a service restart, the restart can still be faster than the magnitude of the time change, so the clock can still effectively go backwards. Again, not monotonic.

[^slew]: If slew _is_ used, then that might increase the likelihood that identical timestamps occur, as time effectively slows down while the correction is made.

If our DB server is in a (single writer, many readers) cluster, the same thing can happen if we fail over to a server that is behind the previous writer. `now()` again ends up in the past, until the time difference is caught up with.

So, our timestamp is not unique, not monotonically increasing, and we can't even trust that identical values will sort stably[^secondarysort]. This means that our clients could miss items when paging.

[^secondarysort]: An [HN commenter said](https://news.ycombinator.com/item?id=38759601): "I found it to be a generally useful rule to never `ORDER BY created` but instead `ORDER BY created,id` instead to achieve stable sorting." Which, yeah, is great advice. It's probably great advice for any "sort by timestamp" scenario -- you just need a another unique value to use as the secondary sort, even if it's not itself usefully sortable.

**Monotonicity Failure Scenario**: If the user has pulled down items to timestamp X and they manage to create a new item at timestamp X-1, they will never get it (at least until a full re-sync).

**Uniqueness Failure Scenario**: If the user has two items at timestamp X and they retrieve a page where the last item on the page is the first of those items, the following page will skip the second of those items, because the query is only looking for items with a greater timestamp. (If we change the query to look for items with greater-than-or-equal timestamp, then we'll be getting duplicate items. Probably better, but still not good -- especially if there's a whole page of duplicates that can never be escaped from.)

Again, these failures are improbable. In our case, a single user creating two items within the same microsecond, and then having those align on a page boundary, is unlikely. As is the possibility that our server clocks drift badly enough that backwards movement occurs.

But it could still happen! Which sucks!

I think that the right way to fix this is to add an ordering column. In our case it only needs to be ordered per user, but it's probably easiest to just use a `BIGSERIAL` and order the whole table. We would then use that column rather than `created` when sorting. It will provide the properties of uniqueness and monotonicity that we need.

There are a few takeaways here:

1. Thinking about time [is hard](https://gist.github.com/timvisee/fcda9bbdff88d45cc9061606b4b923ca).
2. Try your best to recognize your bedrock, implicit assumptions about things. Which is also hard, since they're mostly subconscious.
3. Review other people's code (and have your own reviewed, of course). It forces you to think broader, deeper, and different, and can help you with your own code.

---

There is discussion of this post on Hacker News [here](https://news.ycombinator.com/item?id=38745637).
