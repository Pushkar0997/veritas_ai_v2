const newsText = document.getElementById("newsText");
const predictBtn = document.getElementById("predictBtn");
const statusBox = document.getElementById("status");
const resultBox = document.getElementById("result");

function setStatus(message, isError = false) {
  statusBox.textContent = message;
  statusBox.className = isError ? "status error" : "status";
}

function clearResultClasses() {
  resultBox.classList.remove("success", "fake", "real");
}

function renderResult(data) {
  clearResultClasses();
  resultBox.classList.add("success");

  if (data.label === 1) {
    resultBox.classList.add("fake");
  } else {
    resultBox.classList.add("real");
  }

  resultBox.innerHTML = `
    <div class="pred">${data.prediction}</div>
    <div class="conf">Confidence: ${data.confidence}%</div>
    <div class="conf">REAL: ${data.probabilities.REAL}% | FAKE: ${data.probabilities.FAKE}%</div>
  `;
}

predictBtn.addEventListener("click", async () => {
  const text = newsText.value.trim();

  if (!text) {
    clearResultClasses();
    resultBox.innerHTML = "<span class='error'>Please enter some article text.</span>";
    setStatus("Input is empty.", true);
    return;
  }

  predictBtn.disabled = true;
  setStatus("Predicting...");
  clearResultClasses();
  resultBox.textContent = "Running model inference...";

  try {
    const response = await fetch("/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    renderResult(data);
    setStatus("Prediction complete.");
  } catch (error) {
    clearResultClasses();
    resultBox.innerHTML = `<span class='error'>${error.message}</span>`;
    setStatus("Prediction failed.", true);
  } finally {
    predictBtn.disabled = false;
  }
});
