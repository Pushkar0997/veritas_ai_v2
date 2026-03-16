const tabText = document.getElementById("tabText");
const tabUrl = document.getElementById("tabUrl");
const textInputWrap = document.getElementById("textInputWrap");
const urlInputWrap = document.getElementById("urlInputWrap");
const newsText = document.getElementById("newsText");
const newsUrl = document.getElementById("newsUrl");
const verifyForm = document.getElementById("verifyForm");
const scanBtn = document.getElementById("scanBtn");
const statusText = document.getElementById("statusText");

const resultContainer = document.getElementById("resultContainer");
const loadingState = document.getElementById("loadingState");
const resultState = document.getElementById("resultState");
const truthGauge = document.getElementById("truthGauge");
const truthScoreText = document.getElementById("truthScoreText");
const truthLabel = document.getElementById("truthLabel");
const modelExplanation = document.getElementById("modelExplanation");
const probabilityLine = document.getElementById("probabilityLine");

let activeTab = "text";

function activateTab(tab) {
  activeTab = tab;

  if (tab === "text") {
    textInputWrap.classList.remove("hidden");
    urlInputWrap.classList.add("hidden");
    tabText.className = "rounded-lg border border-cyberBlue/40 bg-cyberBlue/20 px-4 py-2 text-sm font-semibold text-cyberBlue";
    tabUrl.className = "rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300";
  } else {
    urlInputWrap.classList.remove("hidden");
    textInputWrap.classList.add("hidden");
    tabUrl.className = "rounded-lg border border-cyberBlue/40 bg-cyberBlue/20 px-4 py-2 text-sm font-semibold text-cyberBlue";
    tabText.className = "rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-300";
  }
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.className = isError ? "text-sm text-rose-400" : "text-sm text-slate-400";
}

function showLoading() {
  resultContainer.classList.remove("hidden");
  loadingState.classList.remove("hidden");
  resultState.classList.add("hidden");
}

function showResult() {
  loadingState.classList.add("hidden");
  resultState.classList.remove("hidden");
}

function renderResult(data) {
  const confidence = Number(data.confidence || 0);
  const label = Number(data.label);
  const prediction = label === 1 ? "FAKE" : "LIKELY REAL";
  const colorClass = label === 1 ? "text-rose-400" : "text-emerald-400";

  truthGauge.style.setProperty("--score", String(confidence));
  truthScoreText.textContent = `${confidence.toFixed(2)}%`;
  truthLabel.className = `text-sm font-semibold uppercase tracking-widest ${colorClass}`;
  truthLabel.textContent = prediction;

  const explanationFromApi = data.explanation || data.model_explanation || "No explanation payload returned by backend yet. You can extend /predict to return highlighted suspicious tokens.";
  modelExplanation.textContent = explanationFromApi;

  const probs = data.probabilities || {};
  const realVal = probs.REAL !== undefined ? `${probs.REAL}%` : "N/A";
  const fakeVal = probs.FAKE !== undefined ? `${probs.FAKE}%` : "N/A";
  probabilityLine.textContent = `Prediction: ${data.prediction || prediction} | REAL: ${realVal} | FAKE: ${fakeVal}`;
}

async function runScan(textPayload) {
  showLoading();
  setStatus("Scanning for misinformation signals...");
  scanBtn.disabled = true;

  try {
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: textPayload })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to verify the article right now.");
    }

    renderResult(data);
    showResult();
    setStatus("Verification complete.");
  } catch (error) {
    showResult();
    truthGauge.style.setProperty("--score", "0");
    truthScoreText.textContent = "0%";
    truthLabel.className = "text-sm font-semibold uppercase tracking-widest text-rose-400";
    truthLabel.textContent = "ERROR";
    modelExplanation.textContent = error.message;
    probabilityLine.textContent = "";
    setStatus("Verification failed.", true);
  } finally {
    scanBtn.disabled = false;
  }
}

verifyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const textValue = newsText.value.trim();
  const urlValue = newsUrl.value.trim();
  const payload = activeTab === "text" ? textValue : urlValue;

  if (!payload) {
    setStatus(activeTab === "text" ? "Please paste article text before scanning." : "Please enter a URL before scanning.", true);
    return;
  }

  if (activeTab === "url") {
    // Current Flask endpoint expects `text`; URL is forwarded as text until URL ingestion is added server-side.
    setStatus("URL mode sends the URL string to the model endpoint. Add server-side URL scraping for full support.");
  }

  await runScan(payload);
});

tabText.addEventListener("click", () => activateTab("text"));
tabUrl.addEventListener("click", () => activateTab("url"));
