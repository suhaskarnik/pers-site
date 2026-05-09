Personal site at [karniks.net](https://www.karniks.net) — a personal site and blog hosted on GitHub Pages, with a Cloudflare Worker backend powering an LLM-based chatbot on the resume page.

Built with [Hugo](https://gohugo.io/) and the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme. Pushes to `main` trigger a GitHub Actions workflow that builds and deploys to Pages automatically.

## Project structure

| Path | Purpose |
|------|---------|
| `content/experience/index.md` | Professional experience |
| `content/posts/` | Blog posts |
| `worker/index.js` | Cloudflare Worker — handles chatbot requests, rate limiting, and Turnstile verification |
| `layouts/partials/chatbot.html` | Chatbot UI injected into the resume page |
| `wrangler.toml` | Worker configuration (name, KV namespace, allowed origins) |
| `hugo.toml` | Hugo site configuration |
| `.github/workflows/deploy.yml` | CI/CD — builds with Hugo 0.160.1 and deploys to GitHub Pages on push to `main` |

## Local development

```bash
hugo server        # via just: just server
```

The dev server runs at `http://localhost:1313`. The worker's `ALLOWED_ORIGIN` already includes this origin, so the chatbot works locally against the deployed worker.

## Deploying the Cloudflare Worker

First-time setup:

1. Create a [Turnstile](https://www.cloudflare.com/products/turnstile/) widget. Copy the **site key** into `wrangler.toml` (`TURNSTILE_SITE_KEY`) and `layouts/partials/chatbot.html`.
2. Store secrets in the worker (not in `wrangler.toml`):
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler secret put GROQ_API_KEY
   ```
3. Deploy:
   ```bash
   npx wrangler deploy
   ```

The worker uses a KV namespace (`RATE_LIMIT_KV`) for rate limiting — update the `id` in `wrangler.toml` if you recreate it.
