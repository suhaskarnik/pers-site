A resume and blog site hosted on GitHub Pages, with a Cloudflare Worker backend for LLM-powered chatbot responses.

The site is built with [Hugo](https://gohugo.io/) and the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme. Resume content lives in `content/resume/index.md`. Blog posts go in `content/posts/`. Hugo builds everything to `public/`, which GitHub Actions deploys to Pages.

Run locally: `hugo server`

# Process to deploy the worker

1. Create the Turnstile widget and copy the site key and site secret. The site key goes into `wrangler.toml` and `layouts/partials/chatbot.html`
2. The secret needs to be entered via `npx wrangler secret put TURNSTILE_SECRET_KEY`. Same for `GROQ_API_KEY`
