import { NextResponse } from 'next/server';
import { requireProjectAccess } from '@/lib/auth-guard';
import { guardPaidEndpoint } from '@/lib/paid-endpoint-guard';
import { runExplainerPipeline } from '@/lib/explainer/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = await requireProjectAccess(request, id, 'edit');
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const paid = await guardPaidEndpoint(request);
  if (!paid.ok) return paid.response;
  const result = await runExplainerPipeline({
    projectId: id,
    userId: g.userId,
    skipResolve: true,
    skipRender: true,
    autoApprove: true,
  });
  return NextResponse.json({ script: result.script });
}
