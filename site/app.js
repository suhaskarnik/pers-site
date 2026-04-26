const WORKER_URL = "https://your-worker-url.workers.dev/ask";

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

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    loadingBubble.className = "bubble ai";
    loadingBubble.textContent = data.answer;
  } catch {
    loadingBubble.className = "bubble ai";
    loadingBubble.textContent = "Something went wrong. Please try again.";
  }
}

loadResume();
