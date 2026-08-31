import { NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth-guard';
import { promoteToVocabulary, setVocabularyLock, findVocabulary } from '@/lib/explainer/vocabulary-repo';
import { readOutputConfig } from '@/lib/explainer/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireProjectAccess(request, id, 'view');
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const q = new URL(request.url).searchParams.get('q') || undefined;
  const cfg = await readOutputConfig(id);
  const rows = await findVocabulary(g.userId, { text: q, seriesId: cfg.explainer?.seriesId, category: cfg.explainer?.category });
  return NextResponse.json({
    items: rows.slice(0, 40).map((r) => ({
      id: r.id,
      entityId: r.vocabulary.canonicalEntityId,
      imageUrl: r.thumbnail,
      score: r.score,
      locked: r.vocabulary.locked,
      version: r.vocabulary.version,
    })),
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireProjectAccess(request, id, 'edit');
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const body = await request.json().catch(() => ({}));
  if (body?.action === 'lock' && body?.assetId) {
    const updated = await setVocabularyLock(g.userId, String(body.assetId), body.locked !== false);
    return NextResponse.json({ asset: updated });
  }
  if (!body?.imageUrl || !body?.canonicalEntityId) {
    return NextResponse.json({ message: 'imageUrl and canonicalEntityId required' }, { status: 400 });
  }
  const cfg = await readOutputConfig(id);
  const asset = await promoteToVocabulary({
    userId: g.userId,
    projectId: id,
    imageUrl: String(body.imageUrl),
    canonicalEntityId: String(body.canonicalEntityId),
    name: body.name,
    visualFunction: body.visualFunction,
    scope: body.scope || 'SERIES',
    seriesId: cfg.explainer?.seriesId,
    category: cfg.explainer?.category,
    representation: body.representation,
    promptBlock: body.promptBlock,
    locked: body.locked === true,
  });
  return NextResponse.json({ asset });
}
