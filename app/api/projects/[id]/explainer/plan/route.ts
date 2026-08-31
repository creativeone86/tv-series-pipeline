import { NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth-guard';
import { runExplainerPipeline } from '@/lib/explainer/pipeline';
import { getProject } from '@/lib/repos/project-repo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireProjectAccess(request, id, 'edit');
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const project = await getProject(id);
  const body = await request.json().catch(() => ({}));
  const result = await runExplainerPipeline({
    projectId: id,
    userId: g.userId,
    topic: body?.topic || project?.title || project?.description || '',
    category: body?.category,
    language: body?.language,
    targetSeconds: body?.targetSeconds,
    skipTts: true,
    skipResolve: true,
    skipRender: true,
  });
  return NextResponse.json({ script: result.script });
}
