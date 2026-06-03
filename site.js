const thotivities = [
  { symbol: "🔥", title: "Dance Break Challenge", category: "DANCE CHALLENGE" },
  { symbol: "🎲", title: "Mystery Content Prompt", category: "VIDEO CHALLENGE" },
  { symbol: "💋", title: "Compliment Battle", category: "THOT ADVENTURE" },
  { symbol: "😈", title: "Truth or Dare Roulette", category: "GENERAL THOTIVITIES" },
  { symbol: "🎭", title: "Create a 15 Second Mystery Reaction", category: "VIDEO CHALLENGE" },
  { symbol: "👑", title: "Certified Thotivity Free Choice", category: "CERTIFIED THOTIVITY" },
  { symbol: "⚡", title: "Quick Chaos Challenge", category: "GENERAL THOTIVITIES" },
  { symbol: "📸", title: "Make a Thumbnail Pose Challenge", category: "VIDEO CHALLENGE" }
];

let currentSpin = null;
let selectedAvatar = "🔥";
let currentPassLink = "";

function $(id) { return document.getElementById(id); }
function cleanName(value) { const cleaned = String(value || "").trim(); return cleaned.length ? cleaned : "Someone"; }

function setupAvatars() {
  document.querySelectorAll(".avatar").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".avatar").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      selectedAvatar = button.dataset.avatar || "🔥";
    });
  });
}

function setupSpinPass() {
  const params = new URLSearchParams(window.location.search);
  const spins = params.get("spins");
  const access = params.get("access");
  const name = params.get("name");

  if ($("spinnerName") && name) $("spinnerName").value = name;

  if (spins && access && $("spinLimitBox")) {
    $("spinLimitBox").classList.remove("hidden");
    $("spinLimitText").textContent = `Spin pass active: ${spins} spin(s)`;
  }
}

function spinWheel() {
  const wheel = $("wheel");
  if (!wheel) return;

  $("startArea").classList.add("hidden");
  $("resultArea").classList.add("hidden");
  $("mysteryArea").classList.add("hidden");

  wheel.classList.remove("spin-animation");
  void wheel.offsetWidth;
  wheel.classList.add("spin-animation");

  setTimeout(() => {
    const choice = thotivities[Math.floor(Math.random() * thotivities.length)];
    currentSpin = { name: cleanName($("spinnerName")?.value || ""), avatar: selectedAvatar, ...choice };
    $("symbol").textContent = currentSpin.symbol;
    $("mysteryArea").classList.remove("hidden");
  }, 1600);
}

function revealResult() {
  if (!currentSpin) return;

  $("mysteryArea").classList.add("hidden");
  $("resultArea").classList.remove("hidden");

  if ($("nameBox")) $("nameBox").classList.add("hidden");
  if ($("avatarPicker")) $("avatarPicker").classList.add("hidden");

  $("nameLine").textContent = `${currentSpin.avatar} ${currentSpin.name} spun:`;
  $("title").textContent = `${currentSpin.symbol} ${currentSpin.title}`;
  $("category").textContent = currentSpin.category;

  const text = `${currentSpin.name} spun ${currentSpin.symbol} ${currentSpin.title} on Thotivites247. Category: ${currentSpin.category}`;
  $("resultText").textContent = text;

  const url = new URL(window.location.href);
  url.searchParams.set("name", currentSpin.name);
  url.searchParams.set("avatar", currentSpin.avatar);
  url.searchParams.set("symbol", currentSpin.symbol);
  url.searchParams.set("title", currentSpin.title);
  url.searchParams.set("category", currentSpin.category);
  window.history.replaceState({}, "", url);
}

function loadFromLink() {
  if (!$("resultArea")) return;
  const params = new URLSearchParams(window.location.search);
  const title = params.get("title");
  if (!title) return;
  currentSpin = { name: cleanName(params.get("name") || ""), avatar: params.get("avatar") || "🔥", symbol: params.get("symbol") || "❓", title, category: params.get("category") || "GENERAL THOTIVITIES" };
  if ($("startArea")) $("startArea").classList.add("hidden");
  revealResult();
}

async function shareResult() {
  if (!currentSpin) return;
  const text = $("resultText").textContent;
  const url = window.location.href;
  if (navigator.share) await navigator.share({ title: "Thotivites247 Spin", text, url });
  else { await navigator.clipboard.writeText(`${text}\n${url}`); alert("Result copied!"); }
}

async function copyResult() {
  if (!currentSpin) return;
  await navigator.clipboard.writeText(`${$("resultText").textContent}\n${window.location.href}`);
  alert("Result copied!");
}

function resetSpin() {
  currentSpin = null;
  if ($("mysteryArea")) $("mysteryArea").classList.add("hidden");
  if ($("resultArea")) $("resultArea").classList.add("hidden");
  if ($("startArea")) $("startArea").classList.remove("hidden");
  if ($("nameBox")) $("nameBox").classList.remove("hidden");
  if ($("avatarPicker")) $("avatarPicker").classList.remove("hidden");
  const url = new URL(window.location.href);
  url.search = "";
  window.history.replaceState({}, "", url);
}

function cleanChallengeText(value) {
  return String(value || "").replace(/https?:\/\/\S+/gi, "").replace(/@\w+/g, "").replace(/#thotivities?/gi, "").replace(/\s+/g, " ").trim();
}

function generatePrompt() {
  if (!$("challengeText")) return;
  const creator = cleanName($("creatorName").value);
  const challenge = cleanChallengeText($("challengeText").value);
  const category = $("categorySelect").value;
  const symbol = $("symbolSelect").value;
  if (!challenge) { alert("Add a challenge first."); return; }
  const prompt = `${symbol} ${challenge}\nCategory: ${category}\nSubmitted by: ${creator}\n#thotivities #Thotivites247`;
  $("promptOutput").textContent = prompt;
  $("promptCard").classList.remove("hidden");
}

async function copyPrompt() {
  if (!$("promptOutput") || !$("promptOutput").textContent.trim()) generatePrompt();
  await navigator.clipboard.writeText($("promptOutput").textContent);
  alert("Prompt copied!");
}

function makePass(spins) {
  const name = cleanName($("passName")?.value || "");
  const code = Date.now().toString(36);
  const url = new URL("https://thotivites247.pages.dev/spin.html");
  url.searchParams.set("access", code);
  url.searchParams.set("spins", String(spins));
  url.searchParams.set("name", name);
  currentPassLink = url.toString();
  $("passOutput").textContent = `${name} has a ${spins} spin pass:\n${currentPassLink}`;
  $("passLink").href = currentPassLink;
  $("passCard").classList.remove("hidden");
}

function makeCustomPass() {
  const amount = Math.max(1, Math.min(99, parseInt($("customSpinCount").value || "1", 10)));
  makePass(amount);
}

async function copyPass() {
  if (!currentPassLink) { alert("Create a pass first."); return; }
  await navigator.clipboard.writeText(currentPassLink);
  alert("Pass link copied!");
}

async function sharePass() {
  if (!currentPassLink) { alert("Create a pass first."); return; }
  if (navigator.share) await navigator.share({ title: "Thotivites247 Spin Pass", text: "Spin on Thotivites247", url: currentPassLink });
  else await copyPass();
}

setupAvatars();
setupSpinPass();
loadFromLink();
