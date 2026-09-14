---
title: What I learnt designing an agentic app, Part 1
draft: true
tags:
    - architecture
date: 2026-09-12
---

## Where does the LLM actually belong?

And where does it get in the way?

I've been building a proof-of-concept for an insurance claim triage agent. The goal is a standard automation loop: take a claim, find the right policy, check if it's eligible, and prepare a recommendation for a human to review.

![Insurance Agent Arch Diagram](/images/ins-agent.png)

Most agent demos I see fall into one of two camps. Either they go "full agent," letting the LLM handle everything from search to arithmetic, which is impressive until you try to audit a decision. Or they go "full rules," building a rigid decision tree that breaks the moment a user misspells their name or forgets a digit in their policy ID.

While designing this, I focused on a different question: If a step can be checked against a ground truth, why is an LLM doing it?

That question led to a few structural decisions about where the LLM's judgment ends and deterministic code begins.

## Route by checkability, not capability

Just because an LLM *can* perform a task doesn't mean it *should*. For example, finding candidate policies from a messy intake form—misspellings, missing digits, formatting noise—genuinely requires judgment. That's an LLM task. But *scoring* how well those candidates match the input isn't judgment; it's string similarity, phonetic matching, and canonicalization. That's deterministic code. It needs to be reproducible and explainable, not a "vibe."

I applied this same logic to eligibility. A single "eligible: yes/no" call would quietly blend two very different things: "the amount is within the coverage limit" (arithmetic) and "this fits the spirit of the policy guideline" (judgment). If you report those as one verdict, a reviewer sees one fact—but half of that "fact" is a calculation and the other half is a model's interpretation.

To prevent this, the agent reports a Coverage Check and an Eligibility Judgment as two distinct fields. It's a structural enforcement of a simple principle: deterministic and non-deterministic outputs must never be presented as if they carry the same weight.

## Two model tiers, not one giant one

From a practical standpoint, not every call in the pipeline requires the same level of reasoning. Constructing a search query from messy text is simpler than analyzing whether a claim satisfies a complex set of eligibility guidelines. 

Instead of hardcoding specific model names into each step, the agent uses two tiers: `model_fast` and `model_reasoning`. Beyond being a cost lever, it's also a design constraint: it forces me to categorize the complexity of every step in the graph rather than defaulting to "throw the most expensive model at everything."

As agents become industrialised, it will become increasingly important to use the right model for the right job. This design enables such choice.

## Predictability over marginal recall in retries

When the initial policy search comes back empty, the instinct could be to let the LLM analyze the failure and decide how to loosen the search. I rejected that. Instead, the agent follows a fixed, deterministic broadening sequence: drop the date of birth and phone number, then fall back to name-only matching.

There is a real trade-off here. An adaptive, LLM-directed retry could potentially find a match that a fixed sequence misses. But a fixed sequence means the retry path is fully testable and predictable. There is no scenario where the retry logic surprises a reviewer with a third attempt that nobody can explain. Given that the entire system is designed to be legible to a human, I decided that a small loss in potential recall was worth the gain in predictability.

## The gates are a design stance, not a fallback

None of these boundaries are particularly useful if the system just spits out a final answer. The pipeline is built around two hard-coded human-in-the-loop checkpoints. 

First, the Policy Selection Gate. If the search returns multiple ambiguous candidates with no single perfect match, the agent stops. No model ever guesses which of two people filed a claim. 

Second, the Final Review Gate. No matter how confident the agent's recommendation is, nothing customer-facing—no notification, no approval—goes out without a human reviewing the full set of judgments and the drafted message.

These aren't "fail-safes" for when the model is unsure. They are structural requirements. The model's job is to prepare the best possible recommendation; the human's job is to bridge the gap between "the model is confident" and "this action should be taken."

## What's next

This first post is about the boundary between judgment and deterministic logic. In the next post, I'll cover the engineering side of those human gates—specifically, how to make a "pause for a human" step durable using a Postgres checkpointer, and how content-addressed caching keeps the POC from burning through tokens. After that, I'll dive into the gaps this POC deliberately leaves open—like temporal versioning of guidelines and PII governance—which is where the real enterprise-scale conversation starts.

The full ADRs, the domain vocabulary, and the six scripted scenarios used to test these boundaries are all in the repo.

---
*This is post 1 of a series on the architecture behind a claim-triage agent POC. Repo: [link](https://github.com/suhaskarnik/ins-agent)
