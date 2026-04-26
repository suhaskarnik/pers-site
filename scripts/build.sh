#!/usr/bin/env bash
set -e

INPUT=content/resume.md
OUTPUT=site/resume.html

pandoc "$INPUT" -o "$OUTPUT" \
  --from markdown \
  --to html \
  --standalone \
  --metadata title="Resume"
