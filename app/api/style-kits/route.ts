import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-guard';
import { listStyleKits } from '@/lib/explainer/style-kit-repo';
import { DEFAULT_STYLE_KIT_ID } from '@/lib/explainer/style-kits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** List style presets available to the user (their saved kits + builtins). */
export async function GET(request: Request) {
  const g = requireUser(request);
  if (!g.ok) return NextResponse.json({ message: g.message }, { status: g.status });
  const kits = await listStyleKits(g.userId);
  const items = kits.map((k) => ({
    id: k.id,
    name: k.name,
    plateProfile: k.plateProfile,
    parentId: k.parentId,
    thumbnail: k.styleAnchorUrl || '',
  }));
  return NextResponse.json({ kits: items, defaultId: DEFAULT_STYLE_KIT_ID });
}
