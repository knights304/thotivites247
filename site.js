const API_BASE = "https://thotivites247-api.thot2thoughts.workers.dev";

let activities = [
  { id: "fallback_1", title: "Dance Break Challenge", category: "DANCE CHALLENGE", symbol: "🔥", chaosLevel: 7, colorValue: 0xFFFF4FD8 },
  { id: "fallback_2", title: "Mystery Content Prompt", category: "VIDEO CHALLENGE", symbol: "🎲", chaosLevel: 5, colorValue: 0xFF7B2CBF },
  { id: "fallback_3", title: "Truth or Dare Roulette", category: "GENERAL THOTIVITIES", symbol: "😈", chaosLevel: 6, colorValue: 0xFF9D4EDD }
];

let currentSpin = null;
let lastRotation = 0;
let currentPassId = "";
let currentPass = null;
let passConsumedForSpin = false;

function $(id) { return document.getElementById(id); }
function cleanSymbol(value) { const s = String(value || "").trim(); return (!s || s === "️") ? "❓" : s; }
function intToCssColor(value, fallback = "#9D4EDD") { const n = Number(value); if (!Number.isFinite(n)) return fallback; return "#" + (n & 0xFFFFFF).toString(16).padStart(6, "0"); }
function cleanName(value) { const cleaned = String(value || "").trim(); return cleaned.length ? cleaned : "Someone"; }
function passFromUrl() { const params = new URLSearchParams(location.search); return String(params.get("pass") || params.get("passId") || "").trim().toUpperCase(); }

async function checkPass() {
  currentPassId = passFromUrl();
  if (!currentPassId) return true;
  try {
    const res = await fetch(`${API_BASE}/api/pass/check?pass=${encodeURIComponent(currentPassId)}&ts=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success && data.valid && data.pass) {
      currentPass = data.pass;
      if ($("wheelStatus")) $("wheelStatus").textContent = `Pass ${currentPass.passId}: ${currentPass.remainingSpins}/${currentPass.allowedSpins} spin(s) remaining`;
      return true;
    }
    if ($("wheelStatus")) $("wheelStatus").textContent = `Pass invalid: ${data.reason || "unknown"}`;
    $("startArea")?.classList.add("hidden");
    return false;
  } catch (err) {
    if ($("wheelStatus")) $("wheelStatus").textContent = "Pass check failed. Try again.";
    return false;
  }
}

async function usePassForSpin(spin) {
  if (!currentPassId || passConsumedForSpin) return true;
  try {
    const res = await fetch(`${API_BASE}/api/pass/use`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pass: currentPassId, spinnerName: spin.name, title: spin.title, category: spin.category, symbol: spin.symbol })
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.reason || "Pass could not be used.");
      return false;
    }
    passConsumedForSpin = true;
    currentPass = data.pass;
    if ($("wheelStatus")) $("wheelStatus").textContent = `Pass ${currentPass.passId}: ${currentPass.remainingSpins}/${currentPass.allowedSpins} spin(s) remaining`;
    return true;
  } catch (err) {
    alert("Could not use pass. Check internet connection.");
    return false;
  }
}

async function loadWheel() {
  try {
    const res = await fetch(`${API_BASE}/api/wheel?ts=${Date.now()}`, { cache: "no-store" });
    const data = await res.json();
    if (data.success && Array.isArray(data.activities) && data.activities.length) {
      activities = data.activities.map((item, index) => ({ id: item.id || `activity_${index}`, title: item.title || "Mystery Spin Result", category: item.category || "GENERAL THOTIVITIES", symbol: cleanSymbol(item.symbol || item.mysterySymbol), chaosLevel: item.chaosLevel || 5, colorValue: item.colorValue || 0xFF9D4EDD }));
    }
    if ($("wheelStatus") && !currentPassId) $("wheelStatus").textContent = `Loaded ${activities.length} app-published activities`;
  } catch (err) {
    if ($("wheelStatus") && !currentPassId) $("wheelStatus").textContent = "Using fallback wheel. API did not load.";
  }
  drawAllWheels();
  await checkPass();
}

function drawAllWheels(rotation = 0) {
  ["wheelCanvas", "previewWheel"].forEach((id) => { const canvas = $(id); if (canvas) drawWheel(canvas, rotation); });
}

function drawWheel(canvas, rotation = 0) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = size * 0.46;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);
  ctx.rotate(rotation);
  const count = Math.max(activities.length, 1);
  const sweep = (Math.PI * 2) / count;
  for (let i = 0; i < count; i++) {
    const item = activities[i];
    const start = i * sweep - Math.PI / 2;
    const end = start + sweep;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = intToCssColor(item.colorValue, i % 2 ? "#9D4EDD" : "#4dd99f");
    ctx.fill();
    ctx.strokeStyle = "rgba(8,8,11,.25)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.rotate(start + sweep / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "34px Inter, sans-serif";
    ctx.shadowColor = "rgba(0,0,0,.9)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "white";
    ctx.fillText(cleanSymbol(item.symbol), radius * 0.62, 0);
    ctx.restore();
  }
  ctx.restore();
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.strokeStyle = "#E0AAFF";
  ctx.lineWidth = 7;
  ctx.stroke();
}

async function spinWheel() {
  if (!activities.length) return;
  $("startArea")?.classList.add("hidden");
  $("resultArea")?.classList.add("hidden");
  $("mysteryArea")?.classList.add("hidden");
  const winnerIndex = Math.floor(Math.random() * activities.length);
  const winner = activities[winnerIndex];
  currentSpin = { ...winner, name: cleanName($("spinnerName")?.value) };
  if (!(await usePassForSpin(currentSpin))) {
    $("startArea")?.classList.remove("hidden");
    return;
  }
  const count = activities.length;
  const sweep = (Math.PI * 2) / count;
  const targetAngle = -Math.PI / 2 - (winnerIndex * sweep + sweep / 2);
  const extraSpins = Math.PI * 2 * 5;
  const start = lastRotation;
  const end = extraSpins + targetAngle;
  const duration = 1800;
  const started = performance.now();
  function animate(now) {
    const t = Math.min((now - started) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const rot = start + (end - start) * eased;
    drawAllWheels(rot);
    if (t < 1) requestAnimationFrame(animate);
    else {
      lastRotation = end % (Math.PI * 2);
      $("mysterySymbol").textContent = cleanSymbol(currentSpin.symbol);
      $("mysteryArea")?.classList.remove("hidden");
    }
  }
  requestAnimationFrame(animate);
}

function revealResult() {
  if (!currentSpin) return;
  $("mysteryArea")?.classList.add("hidden");
  $("resultArea")?.classList.remove("hidden");
  $("namePanel")?.classList.add("hidden");
  $("nameLine").textContent = `${currentSpin.name} spun:`;
  $("resultTitle").textContent = `${cleanSymbol(currentSpin.symbol)} ${currentSpin.title}`;
  $("resultCategory").textContent = currentSpin.category;
  const text = `${currentSpin.name} spun ${cleanSymbol(currentSpin.symbol)} ${currentSpin.title} on Thotivites247. Category: ${currentSpin.category}`;
  $("resultText").textContent = text;
  const url = new URL(location.href);
  url.searchParams.set("title", currentSpin.title);
  url.searchParams.set("symbol", cleanSymbol(currentSpin.symbol));
  url.searchParams.set("category", currentSpin.category);
  url.searchParams.set("name", currentSpin.name);
  history.replaceState({}, "", url);
}

function resetSpin() {
  currentSpin = null;
  passConsumedForSpin = false;
  $("resultArea")?.classList.add("hidden");
  $("mysteryArea")?.classList.add("hidden");
  $("startArea")?.classList.remove("hidden");
  $("namePanel")?.classList.remove("hidden");
  if (currentPassId && currentPass && currentPass.remainingSpins <= 0) {
    $("startArea")?.classList.add("hidden");
    if ($("wheelStatus")) $("wheelStatus").textContent = "Pass used up. No spins remaining.";
  }
  const url = new URL(location.href);
  url.searchParams.delete("title");
  url.searchParams.delete("symbol");
  url.searchParams.delete("category");
  url.searchParams.delete("name");
  history.replaceState({}, "", url);
}

async function copyResult() { if (!currentSpin) return; await navigator.clipboard.writeText(`${$("resultText").textContent}\n${location.href}`); alert("Copied!"); }
async function shareResult() { if (!currentSpin) return; const text = $("resultText").textContent; if (navigator.share) await navigator.share({ title: "Thotivites247 Spin", text, url: location.href }); else await copyResult(); }
loadWheel();
