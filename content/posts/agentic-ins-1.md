---
title: What I learnt designing an agentic app, Part 1
draft: false
tags:
    - architecture
    - agents
date: 2026-09-12
---

I've been trying to build an agentic app, to understand the various trade offs design considerations involved. One thing I decided early on was to focus more on the design decisions and architecture, while letting Claude Code handle the coding bit. 

## 🏢 Business Context
In the insurance industry, the triage phase of a claim—determining coverage, verifying identity, and assessing eligibility—is often a primary operational bottleneck. Traditionally, this process relies on manual review or rigid legacy rules that fail when faced with the nuance of unstructured policy documents. The business challenge is balancing high-throughput processing with the absolute necessity of accuracy; in a regulated environment, a single "hallucination" in a coverage determination can lead to significant financial leakage or regulatory non-compliance.

This is where a hybrid agentic approach becomes a force multiplier. LLMs excel at the "semantic heavy lifting"—extracting intent from a claimant's narrative or interpreting the ambiguous language of a policy guideline. By leveraging an agentic graph, we can decompose a monolithic task into a series of specialized reasoning steps, allowing the system to "think" through the triage process much like a human adjuster would, but at a scale and speed that legacy systems cannot match.

However, reasoning is not the same as calculation. For a system to be production-ready in an enterprise setting, we must strictly isolate "judgment" from "execution." Critical paths—such as date arithmetic, policy ID matching via phonetic algorithms, and state persistence—must remain deterministic. We cannot delegate identity verification to a probabilistic model because "close enough" is not acceptable for a legal record. By anchoring the agent's flexibility within a deterministic framework, we ensure the system is auditable, predictable, and fundamentally reliable.


## Where does the LLM actually belong?

And where does it get in the way?

![Insurance Agent Claim Flow](/images/ins-agent-claim-flow.png)

When thinking about this approach, I saw my thoughts rushing towards one of two camps. One camp was to go "full agent," letting the LLM handle everything from search to arithmetic, which is impressive until you try to audit a decision. The other was to go "full rules," building a rigid business rules engine that is brittle and breaks for the same reasons business rules engines have broken for years.

Which led me to an interesting question about the boundaries between determinism and probabilistic behavior. And that in turn led to a few structural decisions about where the LLM's judgment ends and deterministic code begins. But before we go there, let's look at how it is designed.

## System Components

![System Components](/images/ins-agent-system-components.png)

At a glance, this is smaller than it looks from the inside. One local process does almost everything; the only real service boundary is Postgres.

A **CLI/TUI** starts a run — either the interactive triage flow or a scripted scenario replay — and hands it to the **Runner**, which drives the compiled **Agent Graph** (the LangGraph pipeline) to completion, resuming it across both human-in-the-loop gates via the **Checkpointer**. I deliberately did not add a GUI/Web UI to this because it's orthogonal to the real complexity, which is the overall agentic workflow. I may add it in the future, but for now the CLI/TUI does an adequate job. 

Every LLM call in the graph (Recall, Eligibility Judgment, Sufficiency Assessment, the Notification draft) goes through one choke point, the **LLM Client**. It picks a model tier, enforces structured output, retries transient provider errors, and derives a content-addressed cache key before anything reaches the **LLM Provider** (Groq or OpenRouter, swappable by config).

That choke point is also why **Postgres** does more than store data. One instance holds three distinct things: Policy/Claim records the graph reads directly, the LLM Client's response cache, and the Checkpointer's durable HITL state.

Two things sit outside the main flow. **Langfuse** is a pure observer. The Runner opens one trace per run, the LLM Client logs every call (hit or miss) into it. And the **Eval Suite** is an offline consumer that replays scenarios through the same Agent Graph with the cache deliberately bypassed, to catch judgment drift before it reaches a real claim.

The **Output** is deliberately anticlimactic: an approved Notification gets written to disk as text. Nothing is actually sent — this is a POC, so this simplification was warranted. 


## Route by checkability, not capability

Just because an LLM *can* perform a task doesn't mean it *should*. For example, finding candidate policies from a messy intake form—misspellings, missing digits, formatting noise—genuinely requires judgment. That's an LLM task. But *scoring* how well those candidates match the input isn't judgment; it's string similarity, phonetic matching, and canonicalization. In other words, it's deterministic code. It needs to be reproducible and explainable, not a "vibe."

I applied this same logic to eligibility. A single "eligible: yes/no" call would quietly blend two very different things: "the amount is within the coverage limit" (arithmetic) and "this fits the spirit of the policy guideline" (judgment). If you report those as one verdict, a reviewer sees one fact—but half of that "fact" is a calculation and the other half is a model's interpretation.  That ran counter to one principle I sought from the very beginning, which was that facts and interpretations must be distinguishable and legible to the human. This is vital to ensure that the human is making decisions in full knowledge of what the level of uncertainty is.

To prevent this, the agent reports a Coverage Check and an Eligibility Judgment as two distinct fields. It's a structural enforcement of a simple principle: deterministic and non-deterministic outputs must never be presented as if they carry the same weight.

## Two model tiers, not one giant one

From a practical standpoint, not every call in the pipeline requires the same level of reasoning. Constructing a search query from messy text is simpler than analyzing whether a claim satisfies a complex set of eligibility guidelines. 

Instead of hardcoding specific model names into each step, the agent uses two tiers: `model_fast` and `model_reasoning`. Beyond being a cost lever, it's also a design constraint: it forces me to categorize the complexity of every step in the graph rather than defaulting to "throw the most expensive model at everything."

As agents become industrialised, it will become increasingly important to use the **right model for the right task**. This design enables such choice.

Langfuse is integrated into every model call, so quality, token usage and cost can be monitored.


## Predictability over marginal recall in retries

When the initial policy search comes back empty, one option could be to let the LLM analyze the failure and decide how to loosen the search, but that gets too open-ended. Instead, the agent follows a fixed, deterministic broadening sequence: drop the date of birth and phone number, then fall back to name-only matching.

There is a trade-off here. An adaptive, LLM-directed retry could potentially find a match that a fixed sequence misses. But a fixed sequence means the retry path is fully testable and predictable. There is no scenario where the retry logic surprises a reviewer with a third attempt that nobody can explain. Given that the entire system is designed to be legible to a human, I decided that a small loss in potential recall was worth the gain in predictability.

## The gates are a design stance, not a fallback

None of these boundaries are particularly useful if the system just spits out a final answer. The pipeline is built around two hard-coded human-in-the-loop checkpoints. 

First, the Policy Selection Gate. If the search returns multiple ambiguous candidates with no single perfect match, the agent stops. No model ever guesses which of two people filed a claim. 

Second, the Final Review Gate. No matter how confident the agent's recommendation is, nothing customer-facing goes out without a human reviewing the full set of judgments and a drafted message.

These aren't optional "fail-safes" for when the model is unsure, instead they are structurally enforced. The model's job is to prepare the best possible recommendation; the human's job is to bridge the gap between "the model is confident" and "this action should be taken." This is part of what I believe should constitute "responsible AI", where the human takes the final call, but is also adequately informed and empowered to do so. 

## What's next

This first post is about the boundary between judgment and deterministic logic. In the next post, I'll cover the engineering side of those human gates—specifically, how to make a "pause for a human" step durable using a Postgres checkpointer, and how content-addressed caching keeps the POC from burning through tokens. After that, I'll dive into the gaps this POC deliberately leaves open—like temporal versioning of guidelines and PII governance—which is where the real enterprise-scale conversation starts.

The full ADRs, the domain vocabulary, and the six scripted scenarios used to test these boundaries are all in the repo.

---
*This is post 1 of a series on the architecture behind a claim-triage agent POC. Repo: [link](https://github.com/suhaskarnik/ins-agent)

The other parts are here: [Part 2]({{<relref "agentic-ins-2">}}), [Part 3]({{<relref "agentic-ins-3">}})
