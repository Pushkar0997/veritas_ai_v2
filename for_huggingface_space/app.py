import gradio as gr
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_NAME = "PushkarKumar/veritas_ai_new"

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()

id2label = {0: "REAL", 1: "FAKE"}

def predict_article(text):
    text = (text or "").strip()

    if not text:
        return (
            "No input provided.",
            {"REAL": 0.0, "FAKE": 0.0},
            "Paste a news article or headline + body text."
        )

    inputs = tokenizer(
        text,
        padding="max_length",
        truncation=True,
        max_length=1024,
        return_tensors="pt",
    )

    global_attention_mask = torch.zeros_like(inputs["input_ids"])
    global_attention_mask[:, 0] = 1
    inputs["global_attention_mask"] = global_attention_mask

    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.softmax(outputs.logits, dim=1)[0]

    real_score = float(probs[0])
    fake_score = float(probs[1])
    pred_id = int(torch.argmax(probs).item())
    pred_label = id2label[pred_id]

    details = (
        f"Prediction: {pred_label}\n"
        f"REAL confidence: {real_score:.4f}\n"
        f"FAKE confidence: {fake_score:.4f}\n\n"
        "This is a research demo. It is not a substitute for factual verification."
    )

    return pred_label, {"REAL": real_score, "FAKE": fake_score}, details

demo = gr.Interface(
    fn=predict_article,
    inputs=gr.Textbox(
        lines=16,
        label="Article text",
        placeholder="Paste a news article, or a headline plus body text..."
    ),
    outputs=[
        gr.Textbox(label="Prediction"),
        gr.Label(label="Confidence"),
        gr.Textbox(label="Details", lines=8),
    ],
    title="Veritas AI Demo",
    description="Interactive inference demo for PushkarKumar/veritas_ai_new.",
    examples=[
        ["Headline: Example headline\n\nBody: Example article body text goes here."]
    ],
    flagging_mode="never",
)

if __name__ == "__main__":
    demo.launch()