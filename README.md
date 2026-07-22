# Math Problem Generator

**Live site: https://aryansharma238.github.io/Math-problem-generator-open-router-based/**

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
- Default model is `nvidia/nemotron-3-ultra-550b-a55b:free`, with
  `poolside/laguna-s-2.1:free` and `cohere/north-mini-code:free` as
  alternatives in the dropdown.
- Every question is generated as multiple-choice with 4 answer options, a
  detailed step-by-step solution, and an explanation for why each wrong
  choice is wrong. Choices are clickable — answering gives instant feedback,
  and the full solution can be revealed on demand.

OpenRouter's free tier allows **50 requests/day** per key (20/min) with zero
cost, no credit card required.

## Running locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## Deploying

This repo deploys via GitHub Pages from the `main` branch root.
