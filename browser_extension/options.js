// Options page script

const DEFAULT_HF_URLS = [
  "https://veritas-ai-v2.hf.space/api/predict",
  "https://huggingface.co/spaces/PushkarKumar/veritas-ai-v2/api/predict",
];
const DEFAULT_LOCAL = "http://localhost:5000/predict";

function showStatus(msg, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = msg;
  statusEl.className = `status ${type}`;
  setTimeout(() => statusEl.className = 'status', 3000);
}

async function loadSettings() {
  const cfg = await chrome.storage.local.get({
    hf_urls: DEFAULT_HF_URLS,
    local_url: DEFAULT_LOCAL,
    prefer_hf: true,
  });

  document.getElementById('hf-urls').value = (cfg.hf_urls || DEFAULT_HF_URLS).join('\n');
  document.getElementById('local-url').value = cfg.local_url || DEFAULT_LOCAL;
  document.getElementById('prefer-hf').checked = cfg.prefer_hf !== false;
}

async function saveSettings() {
  const hfUrlsText = (document.getElementById('hf-urls').value || '').trim();
  const hfUrls = hfUrlsText.split('\n').map(u => u.trim()).filter(u => u);

  if (!hfUrls.length) {
    showStatus('At least one HF URL is required.', 'error');
    return;
  }

  const localUrl = (document.getElementById('local-url').value || '').trim();
  if (!localUrl) {
    showStatus('Local URL is required.', 'error');
    return;
  }

  await chrome.storage.local.set({
    hf_urls: hfUrls,
    local_url: localUrl,
    prefer_hf: document.getElementById('prefer-hf').checked,
  });

  showStatus('✓ Settings saved!', 'success');
}

async function resetToDefaults() {
  await chrome.storage.local.set({
    hf_urls: DEFAULT_HF_URLS,
    local_url: DEFAULT_LOCAL,
    prefer_hf: true,
  });
  await loadSettings();
  showStatus('✓ Reset to defaults.', 'success');
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  document.getElementById('save').addEventListener('click', saveSettings);
  document.getElementById('reset').addEventListener('click', resetToDefaults);
});
