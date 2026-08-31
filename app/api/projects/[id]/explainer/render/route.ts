import { NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth-guard';
import { runExplainerPipeline } from '@/lib/explainer/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireProjectAccess(request, id, 'edit');
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const result = await runExplainerPipeline({
    projectId: id,
    userId: g.userId,
    skipTts: true,
    skipResolve: true,
    autoApprove: true,
  });
  return NextResponse.json({ finalVideoUrl: result.finalVideoUrl, script: result.script });
}
