const apiKeyInput = document.getElementById("apiKey");
const modelSelect = document.getElementById("model");
const promptInput = document.getElementById("prompt");
const countInput = document.getElementById("count");
const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

const STORAGE_KEY = "mathgen_api_key";

apiKeyInput.value = localStorage.getItem(STORAGE_KEY) || "";
apiKeyInput.addEventListener("change", () => {
  localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim());
});

generateBtn.addEventListener("click", generate);

async function generate() {
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;
  const topic = promptInput.value.trim() || "general math problems, mixed topics";
  const count = Math.min(Math.max(parseInt(countInput.value, 10) || 1, 1), 50);

  if (!apiKey) {
    statusEl.textContent = "Please enter your OpenRouter API key first.";
    return;
  }

  generateBtn.disabled = true;
  statusEl.textContent = "Generating...";
  resultsEl.innerHTML = "";

  const systemPrompt = `You are a math problem generator. Given a topic/prompt, generate exactly ${count} distinct multiple-choice math problems matching it.

Each question must have exactly 4 answer choices, exactly one of which is correct.
Each question must include a detailed step-by-step solution.
Each incorrect choice must include an explanation of the specific mistake or misconception that leads to it.
Verify all numbers and answer choices are mathematically correct and consistent before outputting.

The "question" field must contain ONLY the question text — never embed the answer choices inside it.
Do not include any internal reasoning, revisions, second-guessing, notes, or commentary anywhere in the output, including inside string fields. Do not use markdown code fences.
Return ONLY a valid JSON array, where each element has exactly this shape:

{
  "question": "string",
  "choices": [
    {"label": "A", "text": "string", "correct": true, "explanation": ""},
    {"label": "B", "text": "string", "correct": false, "explanation": "why this is wrong"},
    {"label": "C", "text": "string", "correct": false, "explanation": "why this is wrong"},
    {"label": "D", "text": "string", "correct": false, "explanation": "why this is wrong"}
  ],
  "solution": "detailed step-by-step solution string"
}

Exactly one choice per question must have "correct": true; the rest must be "correct": false with a non-empty "explanation". The correct choice's "explanation" should be an empty string.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Math Problem Generator",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: topic },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API error ${response.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const problems = parseProblems(raw);

    if (!problems.length) {
      statusEl.textContent = "Got a response, but couldn't parse problems from it. Try again.";
      resultsEl.innerHTML = `<div class="problem"><pre>${escapeHtml(raw)}</pre></div>`;
      return;
    }

    renderProblems(problems);
    statusEl.textContent = `Generated ${problems.length} problem(s).`;
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  } finally {
    generateBtn.disabled = false;
  }
}

function parseProblems(raw) {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return [];
  }
  return [];
}

let currentProblems = [];

function renderProblems(problems) {
  currentProblems = problems;

  resultsEl.innerHTML = problems
    .map((p, pi) => {
      const choices = Array.isArray(p.choices) ? p.choices : [];
      const choicesHtml = choices
        .map(
          (c, ci) => `
            <button class="choice-btn" data-problem="${pi}" data-choice="${ci}">
              <span class="choice-label">${escapeHtml(c.label || "")}</span>
              ${escapeHtml(c.text || "")}
            </button>
          `
        )
        .join("");

      return `
        <div class="problem" data-problem="${pi}">
          <span class="num">${pi + 1}.</span>${escapeHtml(p.question || "")}
          <div class="choices">${choicesHtml}</div>
          <p class="feedback" id="feedback-${pi}"></p>
          <button class="steps-toggle" data-problem="${pi}">Show step-by-step solution</button>
          <div class="steps" id="steps-${pi}" hidden>${escapeHtml(p.solution || "")}</div>
        </div>
      `;
    })
    .join("");
}

resultsEl.addEventListener("click", (e) => {
  const choiceBtn = e.target.closest(".choice-btn");
  if (choiceBtn) {
    handleChoiceClick(choiceBtn);
    return;
  }
  const stepsBtn = e.target.closest(".steps-toggle");
  if (stepsBtn) {
    const pi = stepsBtn.dataset.problem;
    const stepsEl = document.getElementById(`steps-${pi}`);
    stepsEl.hidden = !stepsEl.hidden;
    stepsBtn.textContent = stepsEl.hidden ? "Show step-by-step solution" : "Hide step-by-step solution";
  }
});

function handleChoiceClick(choiceBtn) {
  const pi = parseInt(choiceBtn.dataset.problem, 10);
  const ci = parseInt(choiceBtn.dataset.choice, 10);
  const problem = currentProblems[pi];
  const choice = problem.choices[ci];
  const problemEl = document.querySelector(`.problem[data-problem="${pi}"]`);
  const feedbackEl = document.getElementById(`feedback-${pi}`);

  if (problemEl.dataset.answered === "true") return;
  problemEl.dataset.answered = "true";

  problemEl.querySelectorAll(".choice-btn").forEach((btn) => {
    const c = problem.choices[parseInt(btn.dataset.choice, 10)];
    if (c.correct) btn.classList.add("correct");
    btn.disabled = true;
  });

  if (choice.correct) {
    feedbackEl.textContent = "Correct!";
    feedbackEl.className = "feedback correct-text";
  } else {
    choiceBtn.classList.add("incorrect");
    feedbackEl.textContent = choice.explanation || "That's not right.";
    feedbackEl.className = "feedback incorrect-text";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
