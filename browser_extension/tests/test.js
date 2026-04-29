/**
 * Basic extension manifest and structure tests
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = path.join(__dirname, '..');
const REQUIRED_FILES = [
  'manifest.json',
  'background.js',
  'content_script.js',
  'options.html',
  'options.js',
  'style.css',
  'README.md',
];

const REQUIRED_MANIFEST_FIELDS = [
  'manifest_version',
  'name',
  'version',
  'permissions',
  'host_permissions',
  'background',
  'content_scripts',
  'options_page',
];

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    failed++;
  }
}

// Test 1: Required files exist
test('All required files exist', () => {
  REQUIRED_FILES.forEach(file => {
    const filePath = path.join(EXTENSION_ROOT, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing file: ${file}`);
    }
  });
});

// Test 2: manifest.json is valid JSON
test('manifest.json is valid JSON', () => {
  const manifestPath = path.join(EXTENSION_ROOT, 'manifest.json');
  const content = fs.readFileSync(manifestPath, 'utf8');
  JSON.parse(content);
});

// Test 3: manifest.json has required fields
test('manifest.json has all required fields', () => {
  const manifestPath = path.join(EXTENSION_ROOT, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  REQUIRED_MANIFEST_FIELDS.forEach(field => {
    if (!(field in manifest)) {
      throw new Error(`Missing manifest field: ${field}`);
    }
  });
});

// Test 4: JavaScript files have no syntax errors (basic check)
test('JavaScript files are syntactically valid', () => {
  const jsFiles = [
    'background.js',
    'content_script.js',
    'options.js',
  ];
  jsFiles.forEach(file => {
    const filePath = path.join(EXTENSION_ROOT, file);
    const content = fs.readFileSync(filePath, 'utf8');
    try {
      new Function(content);
    } catch (e) {
      throw new Error(`Syntax error in ${file}: ${e.message}`);
    }
  });
});

// Test 5: HTML files are well-formed (basic check)
test('HTML files are present and readable', () => {
  const htmlFile = path.join(EXTENSION_ROOT, 'options.html');
  const content = fs.readFileSync(htmlFile, 'utf8');
  if (!content.includes('<html') || !content.includes('</html>')) {
    throw new Error('options.html appears malformed');
  }
});

// Test 6: Icons directory structure
test('Icons directory structure is correct', () => {
  const iconsDir = path.join(EXTENSION_ROOT, 'icons');
  if (!fs.existsSync(iconsDir)) {
    throw new Error('icons directory missing');
  }
  if (!fs.existsSync(path.join(iconsDir, 'icon-template.svg'))) {
    throw new Error('icon-template.svg missing');
  }
});

// Test 7: README exists and has content
test('README.md has content', () => {
  const readmePath = path.join(EXTENSION_ROOT, 'README.md');
  const content = fs.readFileSync(readmePath, 'utf8');
  if (content.length < 100) {
    throw new Error('README.md appears empty or too short');
  }
  if (!content.toLowerCase().includes('install')) {
    throw new Error('README.md missing installation instructions');
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
