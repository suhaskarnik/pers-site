---
title: "Pay as you Vibe"
date: "2026-05-23"
tags:
    - vibe-coding
draft: true
math: true
---

Most agentic coding tools are shifting from subscription-based pricing to token-based pricing — a change that affects enterprise CTOs, architects, platform engineers, and finance leads equally.

This shift changes the economics of vibe coding and its more disciplined cousin, spec-driven development. Earlier pricing models charged per seat or per request; now it is pay-as-you-go. GitHub Copilot [announced usage-based billing](https://docs.github.com/en/copilot/reference/copilot-billing/request-based-billing-legacy/what-changed-with-billing); Anthropic followed suit with [token-based enterprise pricing](https://support.claude.com/en/articles/11526368-how-am-i-billed-for-my-enterprise-plan).

## What's Happening

GitHub Copilot's billing is built around AI credits, where an AI Credit consumption is calculated as the token usage multiplied with a "multiplier" factor. An AI credit costs $0.01, so the dollar cost of a request is essentially the AI credit consumption divided by 100.

The multiplier is model-specific: cheaper models like Haiku carry a sub-1 multiplier; newer or more capable models carry a higher one. The multiplier is also not fixed, as Copilot has revised it upward significantly. The older multipliers are no longer available on the GitHub website, but [this Reddit thread](https://old.reddit.com/r/GithubCopilot/comments/1sxqjuj/end_of_an_era_multiplier_increases_to_github/) has screenshots of some of them. For Claude Sonnet 4.5, the multiplier was 1; it is now 6, scaling every coding request by that factor.

While GitHub Copilot is a significant player in the enterprise market, the trend is broader. Anthropic briefly experimented with [removing Claude Code from its Pro plans](https://arstechnica.com/ai/2026/04/anthropic-tested-removing-claude-code-from-the-pro-plan/), and only backtracked after significant public backlash.

The fact that they considered removing their [most popular developer product](https://techcrunch.com/2026/03/28/anthropics-claude-popularity-with-paying-consumers-is-skyrocketing/) from a paid plan signals financial pressure that will express itself through other mechanisms — tighter token limits, higher multipliers, or both.

## Outputs vs Outcomes

Token-based billing charges for *outputs*, not *outcomes*. A stream of tokens producing working code costs exactly the same as an equal number of tokens producing an error — and the latter will typically cost more once you factor in the follow-up requests to diagnose and fix it.

Consider what happens when an agent is trying to fix an error in code it wrote. A syntax error is usually the best-case scenario here, because the compiler would flag the offending line of code. The harder part is about *logical errors*. Here, the agent needs to go look up the logs and outputs to understand what happened. A lot of those could be verbose - consuming more tokens. Even if 99% of those tokens are irrelevant to the error, the fact that the agent read them counts towards consumption. 

But that's not all: the logs don't always tell the full story. Bug fixing often requires reconstructing the timeline of what happened, and forming a theory of what happened. That theory could be wrong, so it needs to be tested - which takes more tokens. If it *is* wrong, then the agent needs to come up with a new theory, which also needs to be tested and so on. What all this adds up to, is that understanding the issue and fixing it could cost more than it took to write the line of code in the first place.

In other words, **failure modes in agentic coding are directly billable.**

## The risks posed by changing economics

The first risk relates to how companies work today with coding agents. Token pricing scales with exactly the behaviours enterprises have been encouraged to adopt. Longer context windows, multi-step reasoning, and iterative refinement and the practices that underpin spec-driven development, and they are also the ones that generate the largest token bills. The cost increase is important, but the risk goes deeper than accounting.

Companies have invested in agentic coding workflows on the assumption that productivity gains justify the tooling cost. That assumption was formed under subscription pricing, where the marginal cost of one more agent session was zero. Under token-based billing, every iteration has a price.

A second risk becomes apparent when companies look at what they've already built with coding agents. Agentic coding has genuinely been a force multiplier: functional experts with no coding background can now build working software. What they cannot do is evaluate whether what was built is maintainable. A domain expert who vibe-coded an internal tool has unlocked something real, but they have also taken on a codebase they cannot read, debug, or extend.

Development is a small fraction of a software product's total lifecycle cost. A line of code spends far more time in production than it did in development, which means maintenance costs dwarf the cost of the initial build. 

LLM-generated code compounds this. Research shows it has [poor maintainability](https://arxiv.org/html/2603.03823v4#A1.SS0.SSS0.Px4.p1.1): even Opus 4.5 — the top model in that study — produced less maintainable code than human-written equivalents in 58% of cases. Poor maintainability means more agent sessions for debugging and refactoring. As the codebase grows, so does the cost of each subsequent intervention, steadily eroding the productivity gains from the initial build. Under token-based pricing, this is not merely a quality problem — it compounds directly into billing.

## What this might mean for enterprises adopting coding agents

- Expect increased focus on tokenomics in the short term — and here the word refers not to NFTs but to LLM tokens. Organisations will increasingly start to focus on what coding tasks consume tokens, and start training people on how to get the most high-value tokens.

- Over a longer horizon, routine coding tasks are likely to shift towards cheaper, open-source, self-hosted models. Qwen, Mistral, and Meta's Llama family can cover a large share of day-to-day code generation at a fraction of API cost, particularly when deployed locally via tools like Ollama. That in turn favours open-source coding harnesses like [OpenCode](https://opencode.ai/) and [Pi](https://pi.dev/). It's important for companies to also spend some time sandboxing these coding agents, [like I show here]({{< relref "posts/cc-setup.md"  >}}) for Claude Code

- A strategy built primarily on [tokenmaxxing](https://theweek.com/tech/tokenmaxxing-the-ai-workplace-trend-pushing-rapid-integration) as the headline KPI is brittle. A team that ships fast but accumulates poorly structured code will find itself spending multiple agent sessions diagnosing each subsequent bug fix — and at token-based pricing, each of those sessions appears on the invoice. Sustainable value comes from increasing what developers can produce *and maintain* at scale, not just what they can ship initially.

The recent era of agentic coding has encouraged a culture of building in-house anything that can be built. A sharper focus on full-lifecycle cost could revive the case for COTS and SaaS. Enterprises would be well advised to factor this uncertainty in before going all-in in on agentic coding. 
