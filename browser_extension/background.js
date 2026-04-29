// Background service worker: attempts HF Space, then local backend

const DEFAULT_HF_URLS = [
  "https://veritas-ai-v2.hf.space/api/predict",
  "https://huggingface.co/spaces/PushkarKumar/veritas-ai-v2/api/predict",
];
const DEFAULT_LOCAL = "http://localhost:5000/predict";

async function tryGradioPredict(url, text) {
  const body = JSON.stringify({ data: [text] });
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} from ${url}`);
  const j = await resp.json();
  // Expected format: { "data": [predLabel, {"REAL":score,"FAKE":score}, details] }
  if (!j || !Array.isArray(j.data)) throw new Error("Unexpected HF response format");
  const data = j.data;
  const pred = data[0];
  const probs = data[1] || {};
  const real = Number(probs.REAL || probs.real || 0);
  const fake = Number(probs.FAKE || probs.fake || 0);
  const confidence = Math.max(real, fake) * 100;
  return {
    prediction: pred,
    confidence: Number(confidence.toFixed(2)),
    probabilities: { REAL: Number((real * 100).toFixed(2)), FAKE: Number((fake * 100).toFixed(2)) },
  };
}

async function tryLocalPredict(url, text) {
  const body = JSON.stringify({ text });
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} from ${url}`);
  const j = await resp.json();
  // Expect local format used by app.py
  if (j && j.prediction && j.probabilities) {
    return {
      prediction: j.prediction,
      confidence: j.confidence || Math.max(j.probabilities.REAL || 0, j.probabilities.FAKE || 0),
      probabilities: {
        REAL: Number((j.probabilities.REAL * 100 || 0).toFixed(2)),
        FAKE: Number((j.probabilities.FAKE * 100 || 0).toFixed(2)),
      },
    };
  }
  throw new Error("Unexpected local response format");
}

async function scoreText(text) {
  const cfg = await chrome.storage.local.get({ hf_urls: DEFAULT_HF_URLS, local_url: DEFAULT_LOCAL, prefer_hf: true });
  const hf_urls = Array.isArray(cfg.hf_urls) && cfg.hf_urls.length ? cfg.hf_urls : DEFAULT_HF_URLS;
  const local_url = cfg.local_url || DEFAULT_LOCAL;
  const prefer_hf = cfg.prefer_hf !== false;

  const attempts = [];
  if (prefer_hf) {
    for (const u of hf_urls) attempts.push({ kind: 'hf', url: u });
    attempts.push({ kind: 'local', url: local_url });
  } else {
    attempts.push({ kind: 'local', url: local_url });
    for (const u of hf_urls) attempts.push({ kind: 'hf', url: u });
  }

  let lastError = null;
  for (const a of attempts) {
    try {
      if (a.kind === 'hf') {
        const res = await tryGradioPredict(a.url, text);
        return { ok: true, source: a.url, result: res };
      } else {
        const res = await tryLocalPredict(a.url, text);
        return { ok: true, source: a.url, result: res };
      }
    } catch (err) {
      lastError = err;
      // continue to next
    }
  }
  return { ok: false, error: lastError ? String(lastError) : 'No endpoints available' };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'score_text') {
    (async () => {
      try {
        const out = await scoreText(msg.text || '');
        sendResponse(out);
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true; // indicate async response
  }
});
