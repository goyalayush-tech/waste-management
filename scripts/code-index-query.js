#!/usr/bin/env node
/*
  code-index-query.js: Query the code-index.json file.

  Usage examples:
    node scripts/code-index-query.js symbol ContaminationDetector
    node scripts/code-index-query.js import react
    node scripts/code-index-query.js file ai-services/contamination
    node scripts/code-index-query.js ext .py
*/
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(REPO_ROOT, 'code-index.json');

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('Index not found. Run: npm run index:code');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
}

function searchBySymbol(idx, term) {
  const t = term.toLowerCase();
  return idx.index.filter(e => Array.isArray(e.symbols) && e.symbols.some(s => s.name?.toLowerCase().includes(t)));
}

function searchByImport(idx, term) {
  const t = term.toLowerCase();
  return idx.index.filter(e => Array.isArray(e.imports) && e.imports.some(s => s.toLowerCase().includes(t)));
}

function searchByFile(idx, term) {
  const t = term.toLowerCase();
  return idx.index.filter(e => e.file.toLowerCase().includes(t));
}

function searchByExt(idx, ext) {
  const t = ext.startsWith('.') ? ext.toLowerCase() : '.' + ext.toLowerCase();
  return idx.index.filter(e => e.ext === t);
}

function main() {
  const [mode, ...rest] = process.argv.slice(2);
  if (!mode || rest.length === 0) {
    console.log('Usage: node scripts/code-index-query.js <symbol|import|file|ext> <term>');
    process.exit(1);
  }
  const term = rest.join(' ');
  const idx = loadIndex();
  let results = [];
  switch ((mode || '').toLowerCase()) {
    case 'symbol':
      results = searchBySymbol(idx, term); break;
    case 'import':
      results = searchByImport(idx, term); break;
    case 'file':
      results = searchByFile(idx, term); break;
    case 'ext':
      results = searchByExt(idx, term); break;
    default:
      console.error('Unknown mode:', mode);
      process.exit(1);
  }
  console.log(JSON.stringify({ count: results.length, results }, null, 2));
}

if (require.main === module) main();
