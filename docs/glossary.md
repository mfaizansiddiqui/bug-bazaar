# Glossary

Six terms from the week, each in my own words with an example from The Bug Bazaar (task D5-4).

## Latency

The time between asking for something and getting the answer. It's the wait, not the amount of data.

**In the store:** the Mock panel's "Slow" setting adds 1.5 s to every request, which is how I tested the loading skeletons. "Random" adds 0.1 to 1.5 s per request, so a search for "duck" can come back after a later search for "duc". That's the race condition from D2-6. I don't try to remove latency. I design around it: a 300 ms debounce on search, and results stored by query key, so a late answer for an old search is never shown.

## Idempotency

Doing the same request twice has the same effect as doing it once.

**In the store:** checkout sends an `Idempotency-Key` header. The key is created once per cart (`checkoutStarted` in `cartSlice.ts`) and reused on every retry. If the "Place order" response is lost and the user clicks again, the server sees the same key and returns the first order instead of creating a second one. So one cart means at most one order, and at most one charge.

## Horizontal scaling

Handling more load by adding more machines doing the same job, instead of making one machine bigger (vertical scaling).

**In the store:** in the order design (`docs/orders.md`), payment, inventory and email are separate workers reading from a queue. During a sale, orders pile up in the queue, and we start more payment workers to drain it faster. That only works because each worker can process any order on its own: none of them keeps state the others need.

## CDN

A content delivery network: copies of static files kept on servers around the world, so each user downloads from one close to them.

**In the store:** the production build is only static files (HTML, JS, CSS, images), and GitHub Pages serves them through a CDN. The JS and CSS file names contain a content hash (like `index-<hash>.js`). A new deploy produces new names, so a CDN can cache them for a long time without ever serving an old version. The API is different: product data and stock change, so they are not something you'd put on a CDN for long.

## Cache invalidation

Telling a cache that what it stored is now out of date, so the next read fetches fresh data.

**In the store:** product lists sit in the TanStack Query cache for 60 seconds (`staleTime`), so going back to the grid is instant. After a successful order, `CheckoutPage` calls `invalidateQueries` on the product keys, because the stock we just bought is now wrong in the cache. The next time the grid or a details page is shown, it refetches and shows the lower stock.

## Eventual consistency

Different parts of a system may briefly disagree, but if no new changes come in, they all end up showing the same value.

**In the store:** when someone else buys the last duck, my grid can still say "Only 1 left" for a moment. Then the live stock WebSocket update arrives and the card changes. The server is the source of truth: if I try to check out before my screen catches up, the order API checks stock again and answers 409 with the item's name. In the order design, the order is "confirmed" before the receipt email is sent, and the email catches up later, even if the email service was down for a while.
