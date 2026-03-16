from pathlib import Path

from flask import Flask, jsonify, render_template, request
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_DIR = BASE_DIR / "model_artifacts"


def resolve_model_dir() -> Path:
    """Resolve model directory, supporting both flat and nested extraction layouts."""
    if (DEFAULT_MODEL_DIR / "config.json").exists():
        return DEFAULT_MODEL_DIR

    for child in DEFAULT_MODEL_DIR.iterdir() if DEFAULT_MODEL_DIR.exists() else []:
        if child.is_dir() and (child / "config.json").exists():
            return child

    return DEFAULT_MODEL_DIR


MODEL_DIR = resolve_model_dir()
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

app = Flask(__name__)


try:
    tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))
    model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_DIR))
    model.to(DEVICE)
    model.eval()
    model_load_error = None
except Exception as exc:
    tokenizer = None
    model = None
    model_load_error = str(exc)


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")


@app.route("/verify", methods=["GET"])
def verify_page():
    return render_template("verify.html")


@app.route("/live-feed", methods=["GET"])
def live_feed_page():
    return render_template("live_feed.html")


@app.route("/the-problem", methods=["GET"])
def problem_page():
    return render_template("problem.html")


@app.route("/our-mission", methods=["GET"])
def mission_page():
    return render_template("mission.html")


@app.route("/health", methods=["GET"])
def health():
    if model_load_error:
        return jsonify({"status": "error", "message": model_load_error}), 500
    return jsonify({"status": "ok", "device": str(DEVICE), "model_dir": str(MODEL_DIR)})


@app.route("/predict", methods=["POST"])
def predict():
    if model_load_error:
        return jsonify({"error": "Model failed to load", "details": model_load_error}), 500

    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"error": "Input text is required"}), 400

    try:
        inputs = tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=1024,
            return_tensors="pt",
        )

        global_attention_mask = torch.zeros(inputs["input_ids"].shape, dtype=torch.long)
        global_attention_mask[:, 0] = 1

        input_ids = inputs["input_ids"].to(DEVICE)
        attention_mask = inputs["attention_mask"].to(DEVICE)
        global_attention_mask = global_attention_mask.to(DEVICE)

        with torch.no_grad():
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                global_attention_mask=global_attention_mask,
            )

        logits = outputs.logits[0]
        probs = torch.softmax(logits, dim=0)
        real_prob = probs[0].item()
        fake_prob = probs[1].item()

        if fake_prob > real_prob:
            prediction = "FAKE News"
            confidence = fake_prob
            predicted_label = 1
        else:
            prediction = "REAL News"
            confidence = real_prob
            predicted_label = 0

        return jsonify(
            {
                "prediction": prediction,
                "confidence": round(confidence * 100, 2),
                "label": predicted_label,
                "probabilities": {
                    "REAL": round(real_prob * 100, 2),
                    "FAKE": round(fake_prob * 100, 2),
                },
            }
        )
    except Exception as exc:
        return jsonify({"error": "Prediction failed", "details": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
