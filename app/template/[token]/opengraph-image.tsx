/**
 * /template/[token]/opengraph-image · v2.19 P0.3
 *
 * Dynamic OG image: 1200×630, template icon + name + description + tags.
 * Shown when Twitter / WeChat / LinkedIn / Slack scrape the URL.
 *
 * Uses next/og ImageResponse — Edge-style rendering (but lib/template-share depends
 * on better-sqlite3, so this must stay on the nodejs runtime).
 */

import { ImageResponse } from 'next/og';
import { cookies } from 'next/headers';
import { getTemplateAssetForToken } from '@/lib/template-share';
import { getTranslations, normalizeLocale } from '@/lib/i18n';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Wind Comic Shared Template';

export default async function OgImage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const found = await getTemplateAssetForToken(token);
  const jar = await cookies();
  const locale = normalizeLocale(jar.get('qfmj-locale')?.value);
  const tRaw = getTranslations(locale);
  const t = tRaw as typeof tRaw & { publicUi: Record<string, string> };
  const ui = t.publicUi;

  // Defaults (missing / expired token still returns a sane image — never 500)
  let icon = '📄';
  let name = ui.templateShare;
  let description = ui.shareLinkExpired;
  let tags: string[] = [];

  if (found) {
    const meta = (found.asset.metadata || {}) as {
      icon?: string;
      tags?: string[];
      nameEn?: string;
    };
    icon = meta.icon || '📄';
    const rawName = found.asset.name || ui.untitledTemplate;
    name = locale === 'en' ? (meta.nameEn || rawName) : rawName;
    description = (found.asset.description || '').slice(0, 120);
    tags = Array.isArray(meta.tags) ? meta.tags.slice(0, 4) : [];
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #0b0b14 0%, #1a1530 50%, #2d1b4e 100%)',
          padding: '70px 80px',
          fontFamily: 'sans-serif',
          color: '#f5e9d5',
        }}
      >
        {/* eyebrow */}
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: '0.3em',
            color: '#d4af37',
            textTransform: 'uppercase',
            marginBottom: 28,
          }}
        >
          SHARED TEMPLATE · WIND COMIC
        </div>

        {/* main row: icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36, marginBottom: 28 }}>
          <div style={{ fontSize: 140, lineHeight: 1 }}>{icon}</div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div
              style={{
                fontSize: 68,
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: 12,
                color: '#fbf3e2',
              }}
            >
              {name}
            </div>
          </div>
        </div>

        {/* description */}
        {description ? (
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: '#cbb88a',
              marginBottom: 32,
              maxWidth: 1040,
              display: 'flex',
            }}
          >
            {description}
          </div>
        ) : null}

        {/* tags */}
        {tags.length > 0 ? (
          <div style={{ display: 'flex', gap: 14, marginTop: 'auto', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  padding: '12px 26px',
                  fontSize: 22,
                  background: 'rgba(212, 175, 55, 0.18)',
                  color: '#d4af37',
                  borderRadius: 999,
                  border: '1px solid rgba(212, 175, 55, 0.42)',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              marginTop: 'auto',
              fontSize: 24,
              color: '#8c7c5a',
              letterSpacing: '0.12em',
            }}
          >
            {ui.cloneHintOg}
          </div>
        )}
      </div>
    ),
    size,
  );
}
