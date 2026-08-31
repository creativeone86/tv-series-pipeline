import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-guard';
import { callLLMWithFallback } from '@/lib/llm-client';
import { robustJsonParse } from '@/lib/polish-json';
import { getStyleKit, persistStyleKit, tweakStyleKit } from '@/lib/explainer/style-kit-repo';
import { validateStyleKitPatch } from '@/lib/explainer/style-kits';
import { renderProofSheet } from '@/lib/explainer/style-plate';
import { persistAsset } from '@/lib/asset-storage';
import { pickScene, rasterizeSvg, renderDiagramSvg } from '@/lib/explainer/svg';
import { kitToBible } from '@/lib/explainer/types';
import { applyStylePlate } from '@/lib/explainer/style-plate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = requireUser(request);
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const body = await request.json().catch(() => ({}));
  let patch = body.patch && typeof body.patch === 'object' ? body.patch : null;
  if (!patch && body.instruction) {
    const r = await callLLMWithFallback({
      system: 'Return ONLY JSON patch over StyleKit fields. No id/version/parentId. Unknown fields forbidden.',
      user: `Current kit:\n${JSON.stringify(await getStyleKit(g.userId, id))}\n\nInstruction: ${body.instruction}`,
      jsonMode: true,
      model: process.env.EXPLAINER_DIRECTOR_MODEL || 'gpt-5.6-sol',
      maxTokens: 2000,
    });
    patch = r.ok && r.content ? robustJsonParse(r.content) : {};
  }
  const checked = validateStyleKitPatch(patch || {});
  if (!checked.ok) return NextResponse.json({ message: checked.error }, { status: 400 });
  const kit = await tweakStyleKit(g.userId, id, checked.patch);
  const bible = kitToBible(kit);
  const tiles: Buffer[] = [];
  for (const kind of ['icon-scene', 'timeline-axis', 'map-dot', 'question', 'gravity', 'recap-full'] as const) {
    const png = await rasterizeSvg(renderDiagramSvg({ kind }, bible), 640, 360);
    tiles.push((await applyStylePlate(png, kit)).buffer);
  }
  const sheet = await renderProofSheet(tiles);
  const persisted = await persistAsset(`data:image/png;base64,${sheet.toString('base64')}`, { contentType: 'image/png', ext: '.png' });
  if (persisted?.url) {
    kit.styleAnchorUrl = persisted.url;
    await persistStyleKit(g.userId, kit, persisted.url);
  }
  return NextResponse.json({ kit, proofSheetUrl: persisted?.url });
}
