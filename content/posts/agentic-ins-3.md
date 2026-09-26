---
title: What I learnt designing an agentic app, Part 3
draft: false
tags:
    - architecture
    - agents
date: 2026-09-18
---

## Three places this claim-triage POC would break at enterprise scale

The first two posts in this series covered where I draw the line between deterministic code and LLM judgment in a claim-triage agent, and the infrastructure that makes a "pause for a human" step durable enough to survive a process restart. Those were about what the system does and how it stays reliable. This one is about what it deliberately doesn't do yet — because a proof of concept that only shows what works is a demo, and I want this repo to signal architectural judgment, not just implementation competence.

That means naming the gaps precisely: how big they are, what it would take to close them, and why I left them open.

## Host LLMs on enterprise-governed infrastructure before real PII arrives

Every LLM call in this agent currently routes through Groq or OpenRouter. I chose them because they're fast, cheap, and require zero procurement friction — perfect for a portfolio project running entirely fake seed data. But if this pipeline ever handled real claimant PII, that choice would be a data-governance failure, not a cost optimization.

Real insurer data can't transit through a general-purpose inference API with standard terms of service. A production deployment needs a provider with contractual data-protection guarantees: AWS Bedrock, Azure AI Foundry, or a similarly governed host. The model-quality question is almost secondary; the primary issue is legal and contractual control over where the data lands and who can see it.

The swap itself is mechanically simple. Swapping Groq for OpenRouter is already a single `.env` variable in `config.py`. But the compliance work around data residency, retention, and subprocessors isn't. The POC sidesteps the entire question by using fake data throughout. That's a legitimate boundary for a proof of concept, but it's a hard stop for any real deployment.

## Pin the exact software state that produced every judgment

Right now, if a reviewer asked me to reproduce last month's eligibility decision for a specific claim, I'd be stuck. The Langfuse trace has the model name and the rendered prompt, but it doesn't capture the git commit hash of the guideline file or the system prompt template that was live at call time. The model and the prompt text are there, but the *source* that produced them is implicit.

The good news is that the gap is right next to existing machinery. The cache key in `src/ins_agent/llm/hashing.py` already computes `sha256(model_id + rendered_prompt + output_schema_name)`. Extending the Langfuse trace metadata to include the commit hash of the prompt and guideline files would make any historical judgment reproducible: checkout that commit, replay the same model tier, get the same output. It's a small extension, but it's not implemented, which means the system's explainability story stops at "here's what the model saw," not "here's the exact version of the judgment criteria we were running."

## Judge every claim against the guideline version in force at filing time

The eligibility guideline is a single Markdown file under `prompts/guidelines/eligibility.md`. When I update it, every future claim gets judged against the new text. That's fine until a claim filed last quarter arrives under this quarter's rules — or until an auditor asks why a March claim was denied under a guideline the legal team didn't publish until June.

This isn't a missing feature. It's a correctness gap baked into the architecture. The graph has no concept of which guideline version was in force when a claim was filed. Git tracks the file's history, but the agent doesn't bind a specific commit to the claim record. A real system would need the active guideline version durably attached to every claim at intake, and the eval suite would need to test against historical versions rather than whatever is on `main` today. Until then, correctness depends on the guideline never changing, or on human reviewers mentally compensating for drift.

## Build governance around the gates, not just the gates themselves

The two human-in-the-loop checkpoints — Policy Selection and Final Review — are structural constraints I built the graph around. But "the graph stops here" is not the same as "the operation around the graph works."

A claim can sit at a gate indefinitely. If a reviewer is out of office, nothing escalates the claim to a backup. Low-risk, low-amount claims can't be auto-approved by configuration. There's no role-based access control, so any reviewer can in principle approve any policy line. And the only audit artifact is "a human clicked approve" — no identity tied to the action, no recorded rationale. For a six-scenario POC, that's entirely appropriate. At enterprise volume, it's a bottleneck and an audit gap.

The decision to keep the gates simple was scope control, though in an actual productionised app, this would be needed.

## A smoke-test eval suite is not a production eval framework

I did close one gap partially. `just eval` re-runs each Scenario's Eligibility Judgment and Sufficiency Assessment steps against recorded golden outputs, bypassing the cache so it reflects the current prompt and model, and flags drift in the verdict fields. It's real, it's runnable, and it's explicitly not enough.

The golden set is six hand-picked scenarios. The ground truth is my own original judgment at recording time, not an independent human adjudicator. The comparison is a single point-in-time diff, not drift tracked across prompt versions or model releases. And it's pass/fail on individual fields, not statistical confidence. A production eval would need a larger, balanced golden set, independently labeled ground truth, time-series tracking, and statistical metrics.

Building the smoke-sized version and naming the larger gap helps in making clear what a productionised version would required. The code in `src/ins_agent/eval.py` and the `golden_*.json` files in each Scenario directory make the distinction concrete.

## The remaining surface area

Two smaller callouts worth listing without full treatment. The agent runs synchronously through a single Postgres checkpointer with no queueing or backpressure story — fine for demo load, not for production claim volume. And while Langfuse can show per-call cost once pricing metadata is configured, nothing in the system acts on that signal: no budget envelope, no alerting threshold, no circuit breaker if token spend spikes. Visibility without governance is telemetry, not control.

## The stance

The point of a proof of concept isn't to prove the concept works — it's to prove you know where it stops working. Every system has a boundary between "we built this" and "we know what building this would take." The strongest signal for an architecture role isn't that the boundary is clean; it's that you can name the specific things on the far side of it and size them honestly.

Full ADRs, the eval suite code, and the six-scenario fixture matrix are in the repo.

---
*This is post 3 of a series on the architecture behind a claim-triage agent POC. Repo: [link]*

The other parts are here: [Part 1]({{<relref "agentic-ins-1">}}), [Part 2]({{<relref "agentic-ins-2">}})


