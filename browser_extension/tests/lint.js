/**
 * Simple linter for extension files
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_ROOT = path.join(__dirname, '..');

const JS_FILES = [
  'background.js',
  'content_script.js',
  'options.js',
];

let warnings = 0;
let errors = 0;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for console.log in production code (not tests)
    if (line.includes('console.log') && !filePath.includes('test')) {
      console.warn(`⚠ ${path.basename(filePath)}:${lineNum} - console.log found (remove before production)`);
      warnings++;
    }

    // Check for TODO/FIXME comments
    if (line.includes('TODO') || line.includes('FIXME')) {
      console.warn(`⚠ ${path.basename(filePath)}:${lineNum} - ${line.trim()}`);
      warnings++;
    }

    // Check for var usage (prefer const/let)
    if (/^\s*var\s+/.test(line)) {
      console.warn(`⚠ ${path.basename(filePath)}:${lineNum} - 'var' used, prefer 'const' or 'let'`);
      warnings++;
    }
  });
}

console.log('Linting extension files...\n');

JS_FILES.forEach(file => {
  const filePath = path.join(EXTENSION_ROOT, file);
  if (fs.existsSync(filePath)) {
    checkFile(filePath);
  }
});

console.log(`\nLint complete: ${errors} errors, ${warnings} warnings`);
process.exit(errors > 0 ? 1 : 0);
