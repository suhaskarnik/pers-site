---
title: "How This Site Is Built"
date: "2026-05-03"
tags:
    - meta
    - architecture
---

I wanted a personal site that did two things: act as a window into my experience, and give me somewhere to write. Most personal sites do one or the other. I wanted both on the same domain, with a consistent look, and without a hosting bill.

The about page has a chatbot on it. That was a deliberate choice, not a novelty — if someone's looking at my background and wants to ask whether I've worked with Kubernetes or led a platform team, they can just ask rather than scanning bullet points. It also gave me something interesting to build.

Everything runs on free tiers. GitHub Pages serves the static site. A Cloudflare Worker handles chatbot requests and proxies them to Groq's API. Cloudflare KV handles rate limiting. With this design, no databases need to be provisioned, nor servers or associated monthly charges. The constraint wasn't frugality alone — it forced clean, minimal architecture. Every component has exactly one job.

The blog side came next. I was writing posts as static files before realising I'd essentially rebuilt a bad CMS. Switching to Hugo with the PaperMod theme took an afternoon and eliminated a category of problems. The page opts out of PaperMod entirely and uses its own layout, so the two halves of the site don't interfere with each other.

---

# Technical Design

## Stack

| Layer | Tool |
|---|---|
| Static site | Hugo (PaperMod theme) |
| Hosting | GitHub Pages (custom domain `karniks.net`) |
| Chatbot backend | Cloudflare Worker |
| LLM | Groq — `llama-3.1-8b-instant` |
| Rate limiting | Cloudflare KV |
| Bot protection | Cloudflare Turnstile (invisible) |
| Diagrams | Mermaid (rendered client-side) |

## Hugo Structure

Hugo manages all pages. PaperMod's profile mode runs the home page — a bio, social links, and a list of recent posts. The `/posts/` list and individual post pages use PaperMod's standard layouts with no customisation needed.

The `/about/` page is different. It uses a completely custom layout (`layouts/about/single.html`) that renders a two-column container. PaperMod's styles don't apply here — the page loads its own `resume.css` independently.

```
content/
├── _index.md          ← home (profile mode)
├── about/
│   └── index.md       ← about markdown
└── posts/
    └── *.md           ← blog posts

layouts/
├── _default/
│   └── baseof.html    ← PaperMod base (with Mermaid hook)
└── about/
    └── single.html    ← custom two-column layout
```

## Chatbot Architecture

```
Browser → POST /ask { question, turnstileToken }
  ↓
Cloudflare Worker
  ├─ CORS check (locked to production origin)
  ├─ Turnstile verification
  ├─ Per-IP rate limit: 10 req/hour (KV key: ip:{ip}:hour:{YYYY-MM-DD-HH})
  ├─ Global daily cap: 500 req/day (KV key: global:day:{YYYY-MM-DD})
  ├─ Input validation (non-empty, ≤ 500 chars)
  └─ Groq API call → return { answer }
```

The Worker is stateless — no conversation history. Each request is independent. The about page text is a hardcoded constant in the Worker; updating it requires redeploying with `wrangler deploy`.

The LLM prompt instructs the model to answer only from the content and decline questions it can't answer from that context. Temperature is 0.3, max tokens 400 — enough for a useful answer, not enough to ramble.

Rate limiting uses non-atomic KV reads and writes, which is acceptable for a personal site. A concurrent burst could slightly exceed limits, but Durable Objects would be significant complexity for a marginal improvement.

## Mermaid Support

A `render-codeblock-mermaid.html` partial wraps fenced `mermaid` code blocks in a `<div class="mermaid">` container, and `baseof.html` conditionally loads the Mermaid ESM bundle when the page has at least one such block. Diagrams render client-side with no build-time dependency.

## Free Tier Budget

| Service | Free limit | Actual usage |
|---|---|---|
| GitHub Pages | Unlimited static | — |
| Cloudflare Workers | 100K req/day | < 500/day (capped by KV) |
| Cloudflare KV | 100K reads, 1K writes/day | ~2 reads + ~1 write per request |
| Cloudflare Turnstile | Unlimited | — |
| Groq (free tier) | Per-minute token limits | Well within at personal-site traffic |
