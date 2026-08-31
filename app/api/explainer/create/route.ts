import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-guard';
import { createProject, updateProjectById } from '@/lib/repos/project-repo';
import type { ExplainerCategory, ProjectOutputConfig } from '@/types/agents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const g = requireUser(request);
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });

  const body = await request.json().catch(() => ({}));
  const topic = String(body?.topic || '').trim();
  if (topic.length < 4) return NextResponse.json({ message: 'Topic too short' }, { status: 400 });

  const category = (body?.category || 'GENERAL') as ExplainerCategory;
  const language = String(body?.language || 'bg');
  const capEur = Number(body?.capEur) > 0 ? Number(body.capEur) : 40;
  const hardCapEur = Number(body?.hardCapEur) > 0 ? Number(body.hardCapEur) : capEur;
  const explainer: NonNullable<ProjectOutputConfig['explainer']> = {
    category,
    language,
    capEur,
    hardCapEur,
    allowPaidImages: body?.allowPaidImages !== false,
    allowPaidVideo: false,
    outputWidth: Number(body?.outputWidth) || 1920,
    outputHeight: Number(body?.outputHeight) || 1080,
    seriesId: body?.seriesId || undefined,
    ttsProvider: body?.ttsProvider || 'elevenlabs',
    voiceId: body?.voiceId,
    autoApprove: body?.autoApprove === true,
    styleKitId: body?.styleKitId || 'PAPERCUT_DIORAMA_V1',
    frameSource: body?.frameSource || 'auto',
    narrationMode: 'continuous',
    targetDuration: Number(body?.targetSeconds) || 300,
    stingAfterSection: 0,
  };

  const p = await createProject({
    userId: g.userId,
    title: topic.slice(0, 80),
    description: topic,
    status: 'active',
  });
  await updateProjectById(p.id, {
    mode: 'narrated-explainer',
    output_config: JSON.stringify({
      resolution: '720p',
      aspectRatio: '16:9',
      targetDuration: Number(body?.targetSeconds) || 300,
      explainer,
    } satisfies ProjectOutputConfig),
  });

  return NextResponse.json({ projectId: p.id, topic, explainer }, { status: 201 });
}
