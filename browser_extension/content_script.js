(() => {
  if (window.__veritas_extension_installed) return;
  window.__veritas_extension_installed = true;

  const container = document.createElement('div');
  container.id = 'veritas-scorer-container';
  container.innerHTML = `
    <button id="veritas-score-btn">Score page</button>
    <div id="veritas-result" style="display:none"></div>
  `;

  document.body.appendChild(container);

  const btn = document.getElementById('veritas-score-btn');
  const result = document.getElementById('veritas-result');

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Scoring...';
    result.style.display = 'none';

    let text = '';
    const article = document.querySelector('article');
    if (article && article.innerText.trim()) text = article.innerText.trim();
    else text = document.body.innerText || '';

    text = text.replace(/\s+/g, ' ').trim();
    if (!text) {
      result.textContent = 'No readable text found on this page.';
      result.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Score page';
      return;
    }

    // Limit characters to keep payload reasonable
    const payloadText = text.slice(0, 15000);

    try {
      chrome.runtime.sendMessage({ type: 'score_text', text: payloadText }, (resp) => {
        if (!resp) {
          result.textContent = 'No response from extension background.';
          result.style.display = 'block';
          btn.textContent = 'Retry';
          btn.disabled = false;
          return;
        }

        if (resp.ok && resp.result) {
          const d = resp.result;
          result.innerHTML = `\n            <div><strong>${d.prediction}</strong> — Confidence: ${d.confidence}%</div>\n            <div style="font-size:smaller;margin-top:4px">REAL: ${d.probabilities.REAL}% &nbsp; FAKE: ${d.probabilities.FAKE}%</div>\n            <div style="font-size:x-small;margin-top:6px;color:#666">Source: ${resp.source}</div>\n          `;
          result.style.display = 'block';
          btn.textContent = 'Score page';
        } else {
          result.textContent = 'Error scoring page: ' + (resp.error || 'Unknown error');
          result.style.display = 'block';
          btn.textContent = 'Retry';
        }

        btn.disabled = false;
      });
    } catch (err) {
      result.textContent = 'Error scoring page: ' + (err.message || err);
      result.style.display = 'block';
      btn.textContent = 'Retry';
      btn.disabled = false;
    }
  });

})();
