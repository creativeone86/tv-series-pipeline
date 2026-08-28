#!/usr/bin/env node
/**
 * CJK UI gate — fail new Han characters in app/ and components/ TSX
 * unless the file is on the allowlist.
 *
 *   npm run gate:cjk-ui              check
 *   npm run gate:cjk-ui -- --update  rewrite allowlist after a leftover batch
 *
 * Does not scan lib/ (LLM prompts stay Chinese-capable).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ALLOW_PATH = path.join(ROOT, 'lib/cjk-ui-gate/allowlist.json');
const CJK = /[\u3400-\u9fff]/;
const REQUIRED_KEYS = [
  'auth.login',
  'sidebar.overview',
  'errors.retry',
  'dashProjects.title',
  'product.director',
];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function scanHits() {
  const hits = [];
  for (const r of ['app', 'components']) {
    for (const f of walk(path.join(ROOT, r))) {
      if (CJK.test(fs.readFileSync(f, 'utf8'))) hits.push(rel(f));
    }
  }
  return hits.sort();
}

const args = process.argv.slice(2);
const hits = scanHits();

if (args.includes('--update')) {
  const prev = fs.existsSync(ALLOW_PATH) ? JSON.parse(fs.readFileSync(ALLOW_PATH, 'utf8')) : {};
  fs.mkdirSync(path.dirname(ALLOW_PATH), { recursive: true });
  fs.writeFileSync(
    ALLOW_PATH,
    JSON.stringify(
      {
        note: prev.note || 'TSX files that still contain CJK. Shrink as batches land.',
        files: hits,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`✅ CJK allowlist rewritten (${hits.length} files)`);
  process.exit(0);
}

const allow = JSON.parse(fs.readFileSync(ALLOW_PATH, 'utf8'));
const allowed = new Set(allow.files || []);
const fresh = hits.filter((f) => !allowed.has(f));
const stale = [...allowed].filter((f) => !hits.includes(f));

const { t } = await import(path.join(ROOT, 'lib/i18n.ts'));
const missingKeys = [];
for (const loc of ['en', 'zh-CN']) {
  for (const key of REQUIRED_KEYS) {
    const v = t(loc, key);
    if (!v || v === key) missingKeys.push(`${loc}.${key}`);
  }
}

if (missingKeys.length) {
  console.error(`\n❌ CJK UI gate: missing Translations keys\n  ${missingKeys.join('\n  ')}\n`);
  process.exit(1);
}

if (stale.length) {
  console.log(`ℹ️  Allowlist has ${stale.length} cleared file(s). Run --update to shrink it.`);
}

if (fresh.length) {
  console.error(`\n❌ CJK UI gate: ${fresh.length} new TSX file(s) contain Han characters\n`);
  for (const f of fresh) console.error(`  → ${f}`);
  console.error(`\nMove leftover UI through useLocale / t(), or add the file to lib/cjk-ui-gate/allowlist.json with --update.\n`);
  process.exit(1);
}

console.log(`✅ CJK UI gate passed (allowlist ${allowed.size} leftover files; en/zh-CN chrome keys present)`);
process.exit(0);
