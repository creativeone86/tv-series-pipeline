import { NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth-guard';
import { loadExplainerStatus } from '@/lib/explainer/status';
import { writeOutputConfig, readOutputConfig } from '@/lib/explainer/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireProjectAccess(request, id, 'view');
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const status = await loadExplainerStatus(id, g.userId);
  return NextResponse.json(status);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireProjectAccess(request, id, 'edit');
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const body = await request.json().catch(() => ({}));
  const cfg = await readOutputConfig(id);
  const next = {
    ...cfg,
    explainer: { ...(cfg.explainer || {}), ...(body?.explainer || {}) },
  };
  await writeOutputConfig(id, next);
  return NextResponse.json(next);
}
