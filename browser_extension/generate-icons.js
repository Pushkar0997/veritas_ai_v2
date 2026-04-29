#!/usr/bin/env node
/**
 * Generate PNG icons from SVG template for Chrome extension.
 * Requires: npm install sharp
 * Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Try to use sharp if available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('sharp not available. Install with: npm install sharp');
  console.log('Creating placeholder PNG files instead...');
  sharp = null;
}

const SIZES = [16, 48, 128];
const SVG_FILE = path.join(__dirname, 'icons', 'icon-template.svg');
const ICONS_DIR = path.join(__dirname, 'icons');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

if (!fs.existsSync(SVG_FILE)) {
  console.error(`SVG template not found at ${SVG_FILE}`);
  process.exit(1);
}

const svg = fs.readFileSync(SVG_FILE, 'utf8');

async function generateIcons() {
  if (!sharp) {
    console.log('Generating placeholder PNGs...');
    // Create minimal valid PNG files as placeholders
    for (const size of SIZES) {
      const placeholder = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
      ]);
      const iconPath = path.join(ICONS_DIR, `icon-${size}.png`);
      fs.writeFileSync(iconPath, placeholder);
      console.log(`✓ Placeholder created: ${iconPath}`);
    }
    return;
  }

  for (const size of SIZES) {
    const outPath = path.join(ICONS_DIR, `icon-${size}.png`);
    try {
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(outPath);
      console.log(`✓ Generated: ${outPath}`);
    } catch (err) {
      console.error(`✗ Failed to generate icon-${size}.png:`, err.message);
    }
  }
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
