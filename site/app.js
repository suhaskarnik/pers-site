const WORKER_URL = "resume-chatbot.suhaskarnik.workers.dev";

function appendMessage(role, text) {
  const messagesEl = document.getElementById("messages");
  const bubble = document.createElement("div");
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  messagesEl.appendChild(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

async function loadResume() {
  const res = await fetch("resume.html");
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");

  const nameEl = doc.querySelector('h1#suhas-karnik');
  if (nameEl) {
    let next = nameEl.nextElementSibling;
    while (next && next.tagName !== 'H2') {
      const toRemove = next;
      next = next.nextElementSibling;
      toRemove.remove();
    }
    nameEl.remove();
  }

  document.getElementById("resume-container").innerHTML = doc.body.innerHTML;
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

loadResume();

window.addEventListener("load", () => {
  const container = document.getElementById("turnstile-widget");
  if (!container) return;
  const sitekey = container.dataset.sitekey;
  if (!sitekey || sitekey.includes("PLACEHOLDER")) {
    console.error("Turnstile site key not configured. Replace TURNSTILE_SITE_KEY_PLACEHOLDER in index.html before deploying.");
    return;
  }
  container._turnstilePending = null;
  const widgetId = turnstile.render(container, {
    sitekey,
    size: "invisible",
    callback: (token) => container._turnstilePending?.resolve(token),
    "error-callback": (err) => container._turnstilePending?.reject(err),
  });
  container._turnstileWidgetId = widgetId;
});
