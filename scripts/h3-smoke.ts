#!/usr/bin/env tsx
/**
 * MiniMax-H3 smoke. Refuses to spend unless `--yes` is passed.
 *
 *   npx tsx scripts/h3-smoke.ts            # dry-run: print request body, no POST
 *   npx tsx scripts/h3-smoke.ts --yes      # one 768P / 5s text-to-video
 */

import fs from 'fs';
import { resolve } from 'path';

for (const f of ['.env.local', '.env']) {
  const p = resolve(f);
  if (!fs.existsSync(p)) continue;
  for (const raw of fs.readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const k = line.slice(0, eq).trim();
    const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k) process.env[k] = v;
  }
}

async function main() {
  const yes = process.argv.includes('--yes');
  process.env.MINIMAX_H3_RESOLUTION = '768P';

  const { buildH3RequestBody, hasMinimaxH3, MinimaxH3Service } = await import('../services/minimax-h3.service');
  const input = {
    prompt: 'A boy playing basketball by the sea at dusk, cinematic lighting, slow push-in',
    durationSec: 5,
    aspectRatio: '16:9' as const,
  };
  const body = buildH3RequestBody(input);
  console.log('H3 request body');
  console.log(JSON.stringify(body, null, 2));
  console.log(`hasMinimaxH3=${hasMinimaxH3()}  host=${process.env.MINIMAX_H3_BASE_URL || process.env.MINIMAX_BASE_URL || 'https://api.minimax.io'}`);

  if (!yes) {
    console.log('\nDry run. Pass --yes to submit one 768P / 5s job.');
    return;
  }
  if (!hasMinimaxH3()) {
    console.error('MINIMAX_API_KEY missing or ENABLE_MINIMAX_H3=0');
    process.exit(1);
  }
  const svc = new MinimaxH3Service();
  const r = await svc.generateVideo({
    ...input,
    onProgress: (pct, msg) => console.log(`  ${(pct * 100).toFixed(0)}%  ${msg || ''}`),
  });
  console.log('\nOK');
  console.log(`  url: ${r.videoUrl}`);
  console.log(`  task: ${r.taskId}`);
  console.log(`  seconds: ${r.totalSeconds}`);
  console.log(`  resolution: ${r.resolution}`);
  console.log(`  usage: ${JSON.stringify(r.usage)}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
