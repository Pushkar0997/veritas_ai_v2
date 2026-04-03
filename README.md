# Veritas AI

Veritas AI is a Flask web app that serves a local news-classification model for binary text prediction: `REAL News` or `FAKE News`.

The app loads a Hugging Face Transformers sequence classification model from `model_artifacts/` and exposes a simple UI for submitting article text and viewing the model output.

## What is implemented

- Flask backend with routes for the home page, verification page, live feed page, problem page, mission page, and health check.
- `/predict` endpoint that accepts JSON with a `text` field and returns:
  - predicted label
  - confidence score
  - class probabilities for `REAL` and `FAKE`
- `/health` endpoint that reports whether the model loaded successfully and which device is being used.
- Front-end verification UI built with Jinja templates and Tailwind CDN styles.
- Local model loading from the bundled checkpoint directory in `model_artifacts/veritas_ai_pbl_longformer_checkpoints/`.

## What is not implemented

- URL scraping or article extraction on the backend.
- External fact-checking, source lookup, or evidence retrieval.
- Multimodal image verification.
- Live data ingestion for the feed page; the current feed content is static.
- Explanations beyond the model probabilities returned by `/predict`.

Some page copy describes broader vision items such as retrieval, vision analysis, and live monitoring. Those are not part of the working backend in this repository, so this README only documents the parts that actually run.

## Tech Stack

- Python
- Flask
- PyTorch
- Hugging Face Transformers
- Jinja templates
- Tailwind CSS via CDN

## Project Structure

- `app.py` - Flask application, model loading, routes, and prediction API.
- `templates/` - HTML templates for the pages.
- `static/` - Front-end JavaScript and styling assets.
- `model_artifacts/` - Saved model checkpoint and tokenizer files.
- `requirements.txt` - Python dependencies.

## Requirements

- Python installed locally
- The dependencies listed in `requirements.txt`
- The model files present under `model_artifacts/`

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the app:

```bash
python app.py
```

4. Open the app in your browser at:

```text
http://127.0.0.1:5000
```

## How to Use

- Open the verification page.
- Paste article text into the text box.
- Submit the text to get a prediction and confidence score.

The URL tab currently forwards the URL string to `/predict` instead of scraping the article contents. Use pasted text for reliable results.

## API

### `GET /health`

Returns model status information.

### `POST /predict`

Request body:

```json
{
  "text": "Article text here"
}
```

Response includes:

- `prediction`
- `confidence`
- `label`
- `probabilities`

## Notes

- The model expects long-form text input.
- The app runs on `0.0.0.0:5000` in debug mode when started directly with `python app.py`.
- If the model files fail to load, `/health` and `/predict` will return an error message.
