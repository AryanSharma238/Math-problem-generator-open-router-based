# Math Problem Generator

A free, no-backend math problem generator. Type a prompt describing the kind
of problems you want, and it generates them using a free model on
[OpenRouter](https://openrouter.ai).

## How it works

- Static site (HTML/CSS/JS), no server, no build step.
- Calls the OpenRouter chat completions API directly from your browser.
- You bring your own free OpenRouter API key (get one at
  [openrouter.ai/keys](https://openrouter.ai/keys)). It's stored only in your
  browser's `localStorage` — it is never committed to this repo or sent
  anywhere but OpenRouter.
- Default model is `google/gemini-2.0-flash-exp:free`, with
  `meta-llama/llama-3.3-70b-instruct:free` and
  `nvidia/nemotron-3-ultra-550b-a55b:free` as alternatives in the dropdown.

OpenRouter's free tier allows **50 requests/day** per key (20/min) with zero
cost, no credit card required.

## Running locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploying

This repo is set up to deploy via GitHub Pages from the `main` branch root.
