#!/usr/bin/env node
/*
  code-index.js: Walk the repository and build a searchable index of files, symbols, and imports.
*/
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_PATH = path.join(REPO_ROOT, 'code-index.json');

/**
 * File globs we include by extension. Adjust as needed.
 */
const INCLUDE_EXTS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.mjs', '.cjs',
  '.py', '.ipynb',
  '.sol',
  '.md', '.mdx',
  '.yml', '.yaml', '.toml', '.env', '.sql',
  '.sh', '.bat', '.ps1',
  '.css', '.scss', '.sass', '.less', '.html'
]);

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.cache', '.pytest_cache', '__pycache__',
  '.venv', 'venv', '.mypy_cache', '.turbo', '.scannerwork', '.idea', '.vscode',
  'artifacts', 'cache', '.hardhat', '.gradle'
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (INCLUDE_EXTS.has(ext)) results.push(full);
    }
  }
  return results;
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function extractJSImports(src) {
  const imports = [];
  const re = /import\s+[^'"\n]+['\"][^'\"]+['\"];?|require\((['\"][^'\"]+['\"])\)/g;
  let m;
  while ((m = re.exec(src))) {
    const match = m[0];
    const spec = (match.match(/from\s+['\"]([^'\"]+)['\"]/)
      || match.match(/require\(['\"]([^'\"]+)['\"]\)/))?.[1];
    if (spec) imports.push(spec);
  }
  return imports;
}

function extractTSSymbols(src) {
  const symbols = [];
  const re = /(export\s+)?(async\s+)?(function|class|interface|type|enum)\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = re.exec(src))) {
    symbols.push({ type: m[3], name: m[4], exported: Boolean(m[1]) });
  }
  return symbols;
}

function extractJSSymbols(src) {
  const symbols = [];
  const re = /(export\s+)?(async\s+)?function\s+([A-Za-z0-9_]+)|class\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = re.exec(src))) {
    const isFunc = Boolean(m[3]);
    symbols.push({ type: isFunc ? 'function' : 'class', name: m[3] || m[4], exported: Boolean(m[1]) });
  }
  return symbols;
}

function extractPySymbols(src) {
  const symbols = [];
  const re = /^(class|def)\s+([A-Za-z_][A-Za-z0-9_]*)/gm;
  let m;
  while ((m = re.exec(src))) {
    symbols.push({ type: m[1], name: m[2] });
  }
  return symbols;
}

function extractPyImports(src) {
  const imports = [];
  const re = /^\s*(from\s+([\w\.]+)\s+import\s+[\w\*,\s]+|import\s+([\w\.,\s]+))/gm;
  let m;
  while ((m = re.exec(src))) {
    const fromMatch = m[2];
    const importMatch = m[3];
    if (fromMatch) imports.push(fromMatch);
    else if (importMatch) {
      importMatch.split(',').map(s => s.trim()).filter(Boolean).forEach(x => imports.push(x));
    }
  }
  return imports;
}

function extractSolSymbols(src) {
  const symbols = [];
  const re = /(contract|library|interface)\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = re.exec(src))) {
    symbols.push({ type: m[1], name: m[2] });
  }
  return symbols;
}

function indexFile(file) {
  const ext = path.extname(file).toLowerCase();
  const rel = path.relative(REPO_ROOT, file).replace(/\\/g, '/');
  const src = read(file);
  const entry = { file: rel, ext, size: src.length };

  if (['.ts', '.tsx'].includes(ext)) {
    entry.imports = extractJSImports(src);
    entry.symbols = extractTSSymbols(src);
  } else if (['.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
    entry.imports = extractJSImports(src);
    entry.symbols = extractJSSymbols(src);
  } else if (ext === '.py') {
    entry.imports = extractPyImports(src);
    entry.symbols = extractPySymbols(src);
  } else if (ext === '.sol') {
    entry.symbols = extractSolSymbols(src);
  }
  return entry;
}

function main() {
  const files = walk(REPO_ROOT);
  const index = [];
  for (const f of files) {
    try {
      index.push(indexFile(f));
    } catch (e) {
      console.error('Failed to index', f, e.message);
    }
  }
  const meta = {
    generatedAt: new Date().toISOString(),
    root: REPO_ROOT,
    filesCount: index.length
  };
  const payload = { meta, index };
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`Wrote ${index.length} entries to ${OUT_PATH}`);
}

if (require.main === module) {
  main();
}
