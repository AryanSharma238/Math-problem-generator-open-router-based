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

  const systemPrompt = `You are a math problem generator. Given a topic/prompt, generate exactly ${count} distinct math problems matching it.
Respond with ONLY a JSON array (no markdown fences, no commentary), where each element is an object:
{"question": "...", "answer": "..."}
The "answer" should be a short final answer, and may include a brief one-line explanation if helpful.`;

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

function renderProblems(problems) {
  resultsEl.innerHTML = problems
    .map((p, i) => `
      <div class="problem">
        <span class="num">${i + 1}.</span>${escapeHtml(p.question || "")}
        <details>
          <summary>Show answer</summary>
          <div>${escapeHtml(p.answer || "")}</div>
        </details>
      </div>
    `)
    .join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
