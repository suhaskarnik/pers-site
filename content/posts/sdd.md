---
title: Field Notes on SpecKit
draft: true
tags: 
    - vibe-coding
---

I recently started using SpecKit for personal projects to get a hang of the tool and to understand its ability to handle a growing codebase. This post isn't to opine on the "what happens to software devs" debate, but to consider how SpecKit and similar spec driven frameworks work in practice. 

When I began, I started with the mental model of one feature = one spec. Further down the road, this started to show its limitations as incremental updates to features became more awkward to slot into SpecKit's constructs

The app is a personal finance web app inspired by [YNAB](www.ynab.com), but with the following key design choices:
1. The data storage is Postgres and has an API front end built in Go. The reason for choosing Go is that unlike Python, Go more tightly constrains the space of correct programs. For example, it prevents the liberal flouting of public/private visibility of variables. Visibility is obvious when you look at the name of a variable (capitalisation). Unused code in Go is a bug unlike in most languages. In addition, the fast compile time and the excellent toolchain enable fast iteration
2. A CLI, also in Go, that connects to the API. The CLI is written to behave similarly to the `docker` or `kubectl`. The reason for this choice is to enable Bash scripts to interact with app and also in future, allow an LLM to call this CLI. MCP was another potential choice, and there is [quite some debate in the community](https://www.scalekit.com/blog/mcp-vs-cli-use) on this. For a personal app though, a CLI seems to be more appropriate
3. A React frontend webapp using shadcn and Vite. The webapp also calls the same API. I don't work too much on frontend, so this was the most unfamiliar to me
4. This isn't intended to be a commercial app, so authentication is minimal and multi-user support is non-existent


# How I went about it

Claude Code on Pro Plan
Used `superpowers:brainstorming` skill for the initial design. It came up with several good design questions and tradeoffs that I hadn't originally thought of. Used it to output a feature lsit
Passed the feature list, one feature at a time, to SpecKit for implementation
Used Google Stitch to mockup a simple front end and passed it to Claude Code to base the React frontend on
Claude Code does not run directly on my laptop. I've a Claude Code Docker image hosted on a registry my homelab (more on that in a different blog post) and the image gets (re)built nightly. This way, whenever I want to run CC, I simply `podman run ...` and then SSH into it

# What worked well

- Each feature becomes a new branch, thus keeping its changes self-contained. This is in contrast to OpenSpec which doesn't mandate this separation
- Enforcing red-green TDD as part of the `constitition.md` helps a lot, as it ensures the LLM checks its work regularly
- Code quality was consistently good
- Using Go paid off, for the reasons mentioned above

# What didn't

## Heavy process, Massive documentation
Every feature requires the following commands:
- `specify` to first create the original spec and flag ambiguities 
- `clarify` is optional (but mandatory if there are ambiguities)
- `plan` is different from Claude Code's plan mode. This `plan` is SpecKit thinking more deeply about how to implement the spec. This is the most interesting part, as it may kick off research agents to dive deeper into specific choices
- `tasks` breaks down the plan into executable tasks
- `implement` is self-explanatory

Each command generates a markdown file to capture its output. Each feature produces one set of such markdown files. Reviewing each document gets tedious and after a while I was just YOLOing and asking it to proceed with its plans and tasks.

## Burgeoning context window


# What this might 
