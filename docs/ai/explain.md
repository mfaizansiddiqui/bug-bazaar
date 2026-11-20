# Day 5: Explain (21 pts)

Outcome: the design is documented, a teammate's work is reviewed, and the store is presented.

| Task                        | Deliverable                               | Done when                                                                                                                                                                                               |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D5-1 Architecture           | `docs/ARCHITECTURE.md`                    | Folder structure, a data-flow diagram, and where server, client and URL state live. It matches the code, and one choice can be defended.                                                                |
| D5-2 Design patterns        | `docs/ARCHITECTURE.md`                    | Three patterns, each with where it's used and why.                                                                                                                                                      |
| D5-3 Queues / microservices | `docs/orders.md`                          | A diagram of an order service and queue with payment, inventory and email workers. Explains why a queue helps, what happens if email is down, and how the D3-2 idempotency key prevents double charges. |
| D5-4 Vocabulary             | `docs/glossary.md`                        | Latency, idempotency, horizontal scaling, CDN, cache invalidation, eventual consistency, each in your own words with a store example.                                                                   |
| D5-5 Architecture review    | Partner review                            | Two strengths, two risks, one recommendation.                                                                                                                                                           |
| D5-6 Code review            | Partner PR                                | At least 5 useful comments (correctness, readability, accessibility) plus one piece of praise. Respond to comments on your own PR.                                                                      |
| D5-7 AI notes               | `docs/ai-notes.md`                        | Three AI uses (prompt, kept, changed and why), one AI mistake and how you caught it, one thing you wouldn't hand to AI.                                                                                 |
| D5-8 Assessment             | `docs/reflection.md`                      | Every topic rated out of 10, and two gaps, each with one specific next step.                                                                                                                            |
| D5-9 Submission             | Pull request plus a 10-minute walkthrough | CI passes, the README is complete, each task has its own commit. Demo the full flow, one hard bug, one trade-off.                                                                                       |

## Guidance

- Documents must match the code. Check file paths and names against the repo before writing them.
- AI can draft structure. The wording, ratings and reviews must be the engineer's own.
