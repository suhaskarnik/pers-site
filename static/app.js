const WORKER_URL = "https://resume-chatbot.suhaskarnik.workers.dev";

function appendMessage(role, text) {
  const messagesEl = document.getElementById("messages");
  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function getTurnstileToken() {
  return new Promise((resolve, reject) => {
    if (typeof turnstile === "undefined") {
      reject(new Error("Turnstile not loaded"));
      return;
    }
    const container = document.querySelector("#turnstile-widget");
    const widgetId = container?._turnstileWidgetId;
    if (!widgetId) {
      reject(new Error("Turnstile widget not initialised"));
      return;
    }
    container._turnstilePending = { resolve, reject };
    turnstile.reset(widgetId);
    turnstile.execute(widgetId);
  });
}

async function askPreset(q) {
  document.getElementById("question").value = q;
  await ask();
}

async function ask() {
  const questionEl = document.getElementById("question");
  const question = questionEl.value.trim();
  if (!question) return;

  appendMessage("user", question);
  questionEl.value = "";

  const loadingBubble = appendMessage("ai loading", "...");

  let turnstileToken;
  try {
    turnstileToken = await getTurnstileToken();
  } catch {
    loadingBubble.className = "bubble ai";
    loadingBubble.textContent = "Unable to verify request. Please refresh the page.";
    return;
  }

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, turnstileToken }),
    });

    if (res.status === 429) {
      loadingBubble.className = "bubble ai";
      loadingBubble.textContent = "Too many requests — try again in an hour.";
      return;
    }
    if (res.status === 503) {
      loadingBubble.className = "bubble ai";
      loadingBubble.textContent = "The assistant is unavailable for today. Check back tomorrow.";
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch {
      loadingBubble.className = "bubble ai";
      loadingBubble.textContent = "Something went wrong. Please try again.";
      return;
    }

    if (!res.ok) {
      loadingBubble.className = "bubble ai";
      loadingBubble.textContent = data.error || "Something went wrong. Please try again.";
      return;
    }

    loadingBubble.className = "bubble ai";
    loadingBubble.textContent = data.answer;
  } catch {
    loadingBubble.className = "bubble ai";
    loadingBubble.textContent = "Something went wrong. Please try again.";
  }
}

window.addEventListener("load", () => {
  const container = document.getElementById("turnstile-widget");
  if (!container) return;
  const sitekey = container.dataset.sitekey;
  if (!sitekey || sitekey.includes("PLACEHOLDER")) {
    console.error("Turnstile site key not configured.");
    return;
  }
  container._turnstilePending = null;
  const widgetId = turnstile.render(container, {
    sitekey,
    size: "normal",
    callback: (token) => {
			console.log("Turnstile callback fired, token:", token ? "ok" : "empty");
			container._turnstilePending?.resolve(token);
		},
    "error-callback": (err) => container._turnstilePending?.reject(err),
  });
  container._turnstileWidgetId = widgetId;
});
