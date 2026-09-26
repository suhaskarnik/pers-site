---
title: What I learnt designing an agentic app, Part 2
draft: false
tags:
    - architecture
    - agents
date: 2026-09-15
---

## Reliability is an infrastructure problem, not a prompt problem

In the first post of this series, I focused on where to draw the line between deterministic code and LLM judgment. Once those boundaries were set, the next challenge was making the system actually reliable. In the context of a claim triage agent, reliability isn't just about the model giving the right answer—it's about the system surviving the reality of how humans actually work.

The core of this design is the "human-in-the-loop" (HITL) gate. On paper, it's simple: the agent does some work, hits a gate, pauses for a human, and then resumes. When I first prototyped this, I relied on the default in-memory checkpointer. It's the path of least resistance and works perfectly for a demo where the developer is driving the entire flow in a single session.

But a human reviewer doesn't operate on the timeline of a Python process. They walk away for a meeting, they go home for the weekend, or they open a case in a different browser tab. If the agent's state only lives in memory, the "gate" is essentially a hostage situation: the reviewer has to finish their task before the process dies or the server restarts.

To move from a demo to something that feels like actual software, I focused on three infrastructure decisions that treat LLM instability and human latency as first-class constraints.

## Durable state for human gates

I moved away from the in-memory checkpointer in favor of a Postgres-backed store for LangGraph's state. 

In-memory checkpointers are attractive because they're fast to set up and require zero configuration. However, if the goal is to allow a reviewer to "pause and resume later," the state must survive outside the process. Since the project already had a Postgres dependency for claim and policy data, adding a durable checkpointer was a low-cost way to ensure the agent can sleep for three days while a human decides on a policy match and wake up exactly where it left off.

The trade-off here is a slight increase in serialization overhead. Every state transition now involves a database write. For a high-frequency trading bot, this would be a non-starter; for a claim triage agent where the bottleneck is human cognition, it's a rounding error.


![Sequence Diagram](/images/interrupt-resume-sequence.png)

## Content-addressed LLM caching

LLM calls are slow, expensive, and—crucially—too non-deterministic to trust blindly during a debugging cycle. To solve this, I implemented a content-addressed cache that hashes the `model_id`, the `rendered_prompt`, and the `output_schema_name`.

I considered session-based caching, but that doesn't provide reproducibility across different claims or users. By using a content-addressable key, any identical request across the entire system is served from the cache. This turns a 5-second network round-trip into a millisecond DB lookup.

The cost of this decision is the "stale schema" problem. If I change a Pydantic field in the output schema but the prompt remains the same, the cache key still hits, but the cached JSON no longer fits the new model. I handled this by having the `cached_invoke` wrapper catch `ValidationError` during cache retrieval and treat it as a miss. It's not as clean as maintaining a full schema version registry, but it's a pragmatic way to ensure the system doesn't crash during development.

## Observability as a choke point

It's easy to sprinkle logging throughout an agent's nodes, but that often leads to fragmented traces that are hard to piece together. Instead, I routed every single LLM interaction through a single `cached_invoke` function. 

This function acts as the system's choke point. Every call is wrapped in a Langfuse generation span. I made a specific choice to explicitly report `ZERO_USAGE_DETAILS` (0 input/0 output tokens) on cache hits rather than omitting the trace. 

If you only trace cache misses, you know how the model is performing, but you have no visibility into how the cache is performing. By reporting the "zero-cost" hit, I can see the real-world impact of the caching layer on token spend and latency directly in the Langfuse dashboard.

The trade-off is a hard dependency on Langfuse for the agent to function. If the observability provider is down, the agent's primary communication path is affected. I accepted this because, in an LLM system, "silent failure" is a much more expensive risk than "observability downtime."

## The stance

Reliability in LLM agents isn't about finding a prompt that never fails; it's about building an infrastructure that assumes the model—and the humans using it—will be inconsistent. By moving the "truth" of the agent's state and its calls into durable, observable stores, the system becomes a series of reproducible transitions rather than a fragile stream of consciousness.

For a deeper dive into the hashing logic or the checkpointer configuration, check out the `src/ins_agent/llm/hashing.py` file and `docs/adr/0003-postgres-checkpointer.md` in the repo.

---
*This is post 2 of a series on the architecture behind a claim-triage agent POC. Repo: [link](https://github.com/suhaskarnik/ins-agent)

The other parts are here: [Part 1]({{<relref "agentic-ins-1">}}), [Part 3]({{<relref "agentic-ins-3">}})
