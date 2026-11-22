# AI notes

A log of notable AI use (task D5-7). Tool used throughout: Claude Code in VS Code.

## AI uses

### 1. Turning the brief into a week plan

- **Prompt:** I shared the Bug Bazaar PDF and asked for a plan for the week. Then I gave it my own guidelines plan and asked it to follow that plan and my folder layout instead of inventing its own.
- **Kept:** the day-by-day task list mapped to the brief's task IDs, the stack (React 19, TypeScript strict, React Router, TanStack Query, Redux Toolkit, Zod, MSW, antd), and the rule of one commit per task.
- **Changed, and why:**
  - The first plan imported the Week 1 git history and worked inside the old folder. I asked for a separate project and a fresh history, because Week 1 had to stay untouched.
  - It also planned files for Cursor. I only use VS Code with Claude Code, so I had those removed.
  - It suggested RTK Query, but we kept TanStack Query for server data, so server and client state stay visibly separate (`docs/decisions.md`).

### 2. Cleaning up the shop page UI

- **Prompt:** On Day 3 I asked for a simple, cleaner UI built with antd. After reviewing it in the browser, I sent a list of concrete fixes: a logo that fits the brand, Sign in switching to Sign out when signed in, aligned filters, an out-of-stock filter, a working Mock button, and a modern layout that works on desktop, tablet and phone.
- **Kept:**
  - the antd-only layout rules from `UI.md`;
  - the new Availability select (All / In stock / Out of stock) mapped to the API's `inStock=true|false`;
  - the hero banner, the wider cards, and the fix for the grid ending 16 px short of the page edge.
- **Changed, and why:**
  - The first version still had a checkbox with no label, which sat higher than the other filters. I asked for the filters to be aligned, and they became four labelled selects in one row.
  - I asked for the shop to require login. The AI pointed out that the brief protects only account and checkout, and that a memory-only token signs you out on every reload. I decided to leave the shop public.
  - I asked for a theme like a specific video game. It wouldn't copy the game's look and proposed an original "Ink & Crimson" palette instead, which I accepted.
- **How I checked:** screenshots at desktop, tablet and phone widths, and a Lighthouse accessibility rerun (still 100 on home, cart and login).

### 3. Measuring and fixing list performance (D4-2, D4-3)

- **Prompt:** I asked it to work through the Day 4 performance tasks: measure the product list first, fix the two biggest problems it found, and keep the full 5,000-item list fast while scrolling.
- **Kept:**
  - Measuring before changing anything.
  - `React.memo` on `ProductCard`: a live stock update went from re-rendering 50 cards (100–139 ms) to 1 card (13–15 ms).
  - Window virtualization: DOM nodes went from 95,190 to 729 with all 5,000 products loaded.
- **Changed, and why:**
  - One optimization was removed and two were skipped, because they made no measurable difference (`docs/performance.md`). I didn't want code I couldn't justify with a number.

## An AI mistake and how it was caught

The AI wrote the live stock feature so that every stock update dispatched `stockChanged`, and the cart reducer cleared the checkout `Idempotency-Key` whenever that action ran. As a result, a stock update arriving between a failed checkout and its retry gave the retry a new key, and the server could create a **second order**. That is exactly the double charge the key exists to prevent.

It was caught while checking the live stock work against the checkout rules from D3-2 (the cart tests already required one key across retries). The fix: `stockChanged` now clears the key only when a cart quantity actually changes. A test now covers that exact case ("keeps the checkout key when a stock update leaves the quantities unchanged", in `cartSlice.test.ts`).

Lesson: AI code can look right line by line and still break a rule that spans two features. Tests that state the rule ("one key per cart until the cart changes") catch what reading the diff doesn't.

Smaller ones from the same project:

- **A misleading measurement.** A first scroll measurement jumped straight through the list and made virtualization look worse. It was re-measured with a realistic scroll.
- **A wrong reason in a document.** A doc draft gave a different reason for choosing TanStack Query than `decisions.md`. It was caught by checking the draft against the decisions log.
- **A deleted folder.** A cleanup command followed a directory link and deleted part of `node_modules`. It was fixed with `npm install`.

## What I wouldn't hand to AI

**Security trade-offs, and anything I'll have to defend.** Keeping the auth token in memory only means users are signed out on every reload. That is a product decision with a real cost. The AI can list the options (memory, `sessionStorage`, httpOnly cookie), but choosing which risk to accept is mine, and I have to explain it in the walkthrough.

The same goes for my self-assessment and partner reviews: they are only useful if they are my own judgement.
