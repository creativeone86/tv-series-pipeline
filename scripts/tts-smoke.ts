#!/usr/bin/env tsx
/**
 * TTS smoke test — "is my TTS key actually wired?" in one command.
 *
 * Loads .env.local (a standalone tsx script gets none of Next.js's env loading),
 * registers the built-in TTS providers, prints the resolved dispatch chain, then
 * optionally synthesises one line and ffprobes the result.
 *
 * Usage:
 *   npm run tts:smoke                          # list providers only, no API call, no spend
 *   npm run tts:smoke -- --say "Здравей, свят" # synthesise (costs money on paid providers)
 *   npm run tts:smoke -- --say "..." --provider elevenlabs --voice 406EiNlYvqFqcz3vsnOm
 */

import fs from 'fs';
import path from 'path';
import { resolve } from 'path';

for (const f of ['.env.local', '.env']) {
  const p = resolve(f);
  if (fs.existsSync(p)) {
    try { process.loadEnvFile(p); } catch { /* malformed line — keep going */ }
  }
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  await import('../lib/tts-providers/builtins');
  const { listTTSProviders, selectProviders, dispatchTTSGenerate } = await import('../lib/tts-providers/registry');

  const text = arg('say');
  const language = arg('lang') || 'bg';
  const prefer = arg('provider');
  const voiceId = arg('voice') || process.env.ELEVENLABS_VOICE_ID || 'narrator_male_cn';

  console.log('\nRegistered TTS providers');
  console.log('─'.repeat(72));
  for (const p of listTTSProviders()) {
    let ok = false;
    try { ok = p.available(); } catch { ok = false; }
    console.log(`  ${ok ? '✅' : '⬜'}  ${String(p.priority).padStart(3)}  ${p.id.padEnd(20)} ${p.name}`);
  }

  const chain = selectProviders({ language, textLen: text?.length ?? 100, prefer });
  console.log(`\nDispatch chain for language="${language}"${prefer ? ` prefer="${prefer}"` : ''}:`);
  console.log(`  ${chain.length ? chain.map((p) => p.id).join(' → ') : '(empty — no usable provider)'}`);

  if (!chain.length) {
    console.log('\n❌ No usable TTS provider. Set ELEVENLABS_API_KEY (or MINIMAX_API_KEY) in .env.local.');
    process.exit(1);
  }
  if (!text) {
    console.log('\nPass --say "<text>" to synthesise. Skipping the API call (no spend).\n');
    return;
  }

  console.log(`\nSynthesising ${text.length} chars with voice="${voiceId}" …`);
  const t0 = Date.now();
  const { result, tried } = await dispatchTTSGenerate({ text, voiceId, language }, { language, prefer, textLen: text.length });
  if (!result) {
    console.log('\n❌ All providers failed:');
    for (const t of tried) console.log(`   ${t.id}: ${t.error}`);
    process.exit(1);
  }

  const outDir = resolve('data/tts-smoke');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `smoke-${Date.now()}.mp3`);
  const b64 = result.audioUrl.startsWith('data:') ? result.audioUrl.split(',')[1] : null;
  if (b64) {
    fs.writeFileSync(outFile, Buffer.from(b64, 'base64'));
  } else {
    const res = await fetch(result.audioUrl);
    fs.writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
  }

  const { probeAudioDurationFile } = await import('../lib/audio-duration');
  let probed = 0;
  try { probed = await probeAudioDurationFile(outFile); } catch { /* reported below */ }

  console.log('\n✅ Success');
  console.log(`   provider        ${result.provider}`);
  console.log(`   reported dur    ${result.duration.toFixed(2)}s`);
  console.log(`   ffprobe dur     ${probed ? `${probed.toFixed(2)}s` : '(ffprobe unavailable)'}`);
  console.log(`   size            ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB`);
  console.log(`   file            ${outFile}`);
  console.log(`\n   Play it:  open "${outFile}"\n`);
}

main().catch((e) => {
  console.error('\n❌ tts-smoke failed:', e instanceof Error ? e.stack : e);
  process.exit(1);
});
