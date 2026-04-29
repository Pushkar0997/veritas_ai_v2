# VeritasAI Page Scorer Extension

Production-ready Chrome extension that extracts page text and sends it to a scoring backend.

**Features:**
- Floating UI button to score any webpage
- Automatic fallback: tries HF Space first, then local backend
- Settings panel to configure endpoints
- Chrome Web Store ready (manifest v3, service worker)
- Comprehensive tests and CI pipeline

## Behavior

- **Primary**: attempts the Hugging Face Space endpoints (public Gradio API) for `PushkarKumar/veritas-ai-v2`.
- **Fallback**: if HF endpoints are unreachable, it will try the local backend at `http://localhost:5000/predict`.
- **Error handling**: if neither responds, the extension shows a clear error message.

## Install (Development)

### Option 1: Local Testing

1. Run the Flask backend:
```bash
python app.py  # Listens on http://localhost:5000
```

2. Load extension in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode" (top-right)
   - Click "Load unpacked"
   - Select the `browser_extension/` folder

3. Visit any webpage and click the floating "Score page" button (bottom-right).

### Option 2: Using HF Space (No Backend Required)

1. Load the extension (same steps as above).
2. Visit any webpage and click "Score page" — it will use the public HF Space by default.

## Configuration

Open the extension's Options page:
- Right-click extension icon → "Options"
- Or: go to `chrome-extension://[YOUR-EXT-ID]/options.html` (after loading unpacked)

Configure:
- **Hugging Face Endpoints** (one per line): Gradio API URLs to try first.
- **Local Backend**: Fallback URL if HF is down.
- **Prefer HF**: checkbox to prioritize HF endpoints over local.

Default settings are restored via "Reset to Default" button.

## Programmatic Configuration

Use Chrome DevTools console to override settings:
```js
chrome.storage.local.set({
  prefer_hf: false,  // Try local first
  local_url: 'http://localhost:3000/predict',  // Custom local endpoint
  hf_urls: ['https://custom-space.hf.space/api/predict']  // Custom HF endpoints
})
```

## Development & Testing

### Prerequisites
```bash
npm install
```

### Generate Icons
```bash
npm run generate-icons
```
Converts SVG template to PNG icons (16×16, 48×48, 128×128).
Requires `sharp`; uses placeholder PNGs if unavailable.

### Run Tests
```bash
npm test
```
Validates:
- All required files exist
- manifest.json is valid JSON and has required fields
- JavaScript syntax is correct
- HTML structure is well-formed
- Icons directory exists
- README has installation instructions

### Lint
```bash
npm run lint
```
Checks for:
- `console.log` statements (production warning)
- TODO/FIXME comments
- `var` usage (should use const/let)

### Validate All (Tests + Lint)
```bash
npm run validate
```

## CI/CD

GitHub Actions workflow (`.github/workflows/extension-ci.yml`):
- Runs on every push to `main`/`develop` and pull requests
- Validates manifest, tests, lints, generates icons
- Fails if any check fails (ensures quality gate)

## API Response Formats

### Local Backend (Flask app.py)
**Request:**
```json
{
  "text": "Article text here..."
}
```
**Response:**
```json
{
  "prediction": "FAKE News",
  "confidence": 85.23,
  "probabilities": {
    "REAL": 14.77,
    "FAKE": 85.23
  }
}
```

### Hugging Face Space (Gradio)
**Request:**
```json
{
  "data": ["Article text here..."]
}
```
**Response:**
```json
{
  "data": [
    "FAKE",
    {"REAL": 0.1477, "FAKE": 0.8523},
    "Details text..."
  ]
}
```

The extension normalizes both formats internally.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No readable text found" | Page has no extractable text; try a news article |
| "Error scoring page" + no source | Both HF and local endpoints unavailable |
| HF Space times out | Either the space is slow or your internet is down; check https://huggingface.co/spaces/PushkarKumar/veritas-ai-v2 |
| Local backend not working | Ensure Flask app is running: `python app.py` on port 5000 |
| Extension doesn't load | Check DevTools console (F12 → DevTools) for errors; manifest.json must be valid |

## File Structure
```
browser_extension/
├── manifest.json           # Chrome extension manifest (v3)
├── background.js           # Service worker for endpoint fallback logic
├── content_script.js       # Injects UI on every page
├── style.css               # Floating button styles
├── options.html            # Settings panel UI
├── options.js              # Settings panel logic
├── README.md               # This file
├── package.json            # Dev dependencies and scripts
├── generate-icons.js       # Icon generation script
├── icons/
│   ├── icon-template.svg   # SVG source (48×48 base)
│   ├── icon-16.png         # 16×16 icon
│   ├── icon-48.png         # 48×48 icon
│   └── icon-128.png        # 128×128 icon
└── tests/
    ├── test.js             # Manifest and structure validation tests
    └── lint.js             # Simple linter for JS files
```

## Web Store Submission (Future)

To publish to Chrome Web Store:
1. Create a developer account on https://chrome.google.com/webstore/developer/dashboard
2. Zip the extension folder (without `.git`, `node_modules`, etc.)
3. Upload the ZIP and fill in store listing
4. Review and publish

## Security Notes

- Content script runs on all URLs but only injects a button; doesn't capture sensitive data.
- Extension only POSTs page text to configured endpoints; no tracking or telemetry.
- Settings stored locally in Chrome's `chrome.storage.local` (isolated per user/browser).
- All HTTPS endpoints; HTTP localhost only for development.

## License

MIT
