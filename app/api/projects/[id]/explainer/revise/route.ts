import { NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth-guard';
import { listAssetsByType, upsertAsset } from '@/lib/repos/asset-repo';
import { updateProjectById } from '@/lib/repos/project-repo';
import { scriptToBeats, beatsToScript } from '@/lib/explainer/beats';
import { applyBeatRevision, applySectionRevision, lockBeat, scriptVersionPayload } from '@/lib/explainer/revise';
import type { ExplainerPlan } from '@/lib/explainer/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireProjectAccess(request, id, 'edit');
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const body = await request.json().catch(() => ({}));
  const rows = await listAssetsByType(id, 'script');
  let data: any = rows[0]?.data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
  if (!data?.shots) return NextResponse.json({ message: 'no script' }, { status: 404 });
  const plan: ExplainerPlan = {
    title: data.title,
    synopsis: data.synopsis,
    language: data.language || 'bg',
    category: data.category || 'GENERAL',
    beats: scriptToBeats(data),
    sections: data.explainerPlan?.sections,
    factCards: data.explainerPlan?.factCards,
  };
  let next = plan;
  if (body.lockBeatId) next = lockBeat(next, body.lockBeatId, body.locked !== false);
  else if (body.scope === 'section' && body.sectionId && Array.isArray(body.beats)) {
    next = applySectionRevision(next, body.sectionId, body.beats);
  } else if (body.beatId && body.patch) {
    next = applyBeatRevision(next, body.beatId, body.patch);
  }
  const script = beatsToScript(next);
  await upsertAsset({
    projectId: id,
    type: 'script-version' as any,
    name: `script ${new Date().toISOString()}`,
    data: scriptVersionPayload(next, body.note || 'revise'),
  });
  await upsertAsset({ projectId: id, type: 'script', name: script.title, data: { ...script, explainerPlan: next } });
  await updateProjectById(id, { script_data: JSON.stringify(script) });
  return NextResponse.json({ plan: next, script });
}
