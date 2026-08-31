#!/usr/bin/env tsx
/**
 * TEMP live observation harness for the explainer quality/cost fixes.
 * Creates a brand-new 5-min LINE_TOON episode for the demo operator and runs
 * Plan → TTS → Resolve → Render directly through runExplainerPipeline (the same
 * function the API routes call), printing spend / audio / length / frame stats
 * after each stage. Not wired into the app; safe to delete after the run.
 *
 * Run: node --env-file=.env.local ./node_modules/.bin/tsx scripts/explainer-live-run.ts <stage?>
 * stage in: create|plan|tts|resolve|render|all (default all). Project id is read
 * from /tmp/windrun/project.txt so stages can be run independently.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { Client } from 'pg';

const DEMO_USER = 'IUYz_ALiFP1mqXXu-hG4P';
const PROJECT_FILE = '/tmp/windrun/project.txt';
const stage = (process.argv[2] || 'all').toLowerCase();

function log(...a: unknown[]) { console.log(new Date().toISOString().slice(11, 19), ...a); }

async function pg<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try { return (await c.query(sql, params)).rows as T[]; }
  finally { await c.end(); }
}

async function snapshot(projectId: string, label: string) {
  const cost = await pg<{ engine: string; n: string; eur: string }>(
    `select engine, count(*)::text n, coalesce(sum(cost_eur),0)::text eur from cost_log where project_id=$1 group by engine order by 3 desc`,
    [projectId],
  );
  const total = await pg<{ eur: string }>(`select coalesce(sum(cost_eur),0)::text eur from cost_log where project_id=$1`, [projectId]);
  const assets = await pg<{ type: string; n: string }>(
    `select type, count(*)::text n from project_assets where project_id=$1 group by type order by 2 desc`,
    [projectId],
  );
  log(`── snapshot [${label}] ──`);
  log('  spend EUR total:', total[0]?.eur);
  for (const r of cost) log(`   cost ${r.engine}: ${r.n}× = €${r.eur}`);
  for (const a of assets) log(`   asset ${a.type}: ${a.n}`);
}

async function main() {
  const { runExplainerPipeline } = await import('../lib/explainer/pipeline');
  let projectId = existsSync(PROJECT_FILE) ? readFileSync(PROJECT_FILE, 'utf-8').trim() : '';

  if (stage === 'create' || stage === 'all') {
    const { createProject, updateProjectById } = await import('../lib/repos/project-repo');
    const topic = 'Защо Луната не пада върху Земята?';
    const explainer = {
      category: 'PHYSICS', language: 'bg',
      capEur: 18, hardCapEur: 18,
      allowPaidImages: true, allowPaidVideo: false,
      outputWidth: 1920, outputHeight: 1080,
      ttsProvider: 'elevenlabs',
      autoApprove: true,
      styleKitId: 'LINE_TOON_V1',
      frameSource: 'generated',
      narrationMode: 'continuous',
      targetDuration: 300,
      stingAfterSection: 0,
    };
    const p = await createProject({ userId: DEMO_USER, title: topic.slice(0, 80), description: topic, status: 'active' });
    await updateProjectById(p.id, {
      mode: 'narrated-explainer',
      output_config: JSON.stringify({ resolution: '1080p', aspectRatio: '16:9', targetDuration: 300, explainer }),
    });
    projectId = p.id;
    writeFileSync(PROJECT_FILE, projectId);
    log('created project', projectId, 'style=LINE_TOON_V1 frameSource=generated cap=€18 dur=300s');
  }

  if (!projectId) throw new Error('no project id — run create first');
  log('using project', projectId);

  if (stage === 'plan' || stage === 'all') {
    log('▶ PLAN start');
    const t = Date.now();
    const r = await runExplainerPipeline({ projectId, userId: DEMO_USER, topic: 'Защо Луната не пада върху Земята?', category: 'PHYSICS' as any, language: 'bg', targetSeconds: 300, skipTts: true, skipResolve: true, skipRender: true });
    const shots = r.script?.shots || [];
    log(`✓ PLAN done in ${((Date.now() - t) / 1000).toFixed(0)}s — ${shots.length} beats`);
    log('  title:', r.script?.title);
    log('  synopsis:', (r.script as any)?.synopsis?.slice(0, 160));
    for (const s of shots.slice(0, 3)) log(`   beat ${(s as any).id}: [${(s as any).explainerPurpose || (s as any).shotType}] ${(s as any).narrationText?.slice(0, 90)}`);
    await snapshot(projectId, 'after plan');
  }

  if (stage === 'tts' || stage === 'all') {
    log('▶ TTS start');
    const t = Date.now();
    await runExplainerPipeline({ projectId, userId: DEMO_USER, skipResolve: true, skipRender: true, autoApprove: true });
    log(`✓ TTS done in ${((Date.now() - t) / 1000).toFixed(0)}s`);
    const tracks = await pg<{ n: string }>(`select count(*)::text n from project_assets where project_id=$1 and type='narration-track'`, [projectId]);
    log('  narration-track assets:', tracks[0]?.n);
    await snapshot(projectId, 'after tts');
  }

  if (stage === 'resolve' || stage === 'all') {
    log('▶ RESOLVE start');
    const t = Date.now();
    const r = await runExplainerPipeline({ projectId, userId: DEMO_USER, skipTts: true, skipRender: true, autoApprove: true, force: false });
    const res = r.resolutions || [];
    const byStrat: Record<string, number> = {};
    for (const x of res) byStrat[x.strategy] = (byStrat[x.strategy] || 0) + 1;
    const urls = new Set(res.filter((x) => x.imageUrl).map((x) => x.imageUrl));
    log(`✓ RESOLVE done in ${((Date.now() - t) / 1000).toFixed(0)}s — ${res.length} frames, ${urls.size} distinct images`);
    log('  strategies:', JSON.stringify(byStrat));
    await snapshot(projectId, 'after resolve');
  }

  if (stage === 'render' || stage === 'all') {
    log('▶ RENDER start');
    const t = Date.now();
    const r = await runExplainerPipeline({ projectId, userId: DEMO_USER, skipTts: true, skipResolve: true, autoApprove: true });
    log(`✓ RENDER done in ${((Date.now() - t) / 1000).toFixed(0)}s`);
    log('  finalVideoUrl:', r.finalVideoUrl);
    await snapshot(projectId, 'after render');
  }

  log('DONE stage=', stage);
}

main().then(() => process.exit(0)).catch((e) => { console.error('LIVE RUN FAILED', e); process.exit(1); });
