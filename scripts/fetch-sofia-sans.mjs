/**
 * Download OFL Sofia Sans (Bulgarian letterforms as default glyphs) into data/fonts.
 * Usage: node scripts/fetch-sofia-sans.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.join(process.cwd(), 'data', 'fonts');
fs.mkdirSync(ROOT, { recursive: true });

const FILES = [
  {
    url: 'https://github.com/google/fonts/raw/main/ofl/sofiasans/SofiaSans%5Bwght%5D.ttf',
    dest: 'SofiaSans-Variable.ttf',
  },
  {
    url: 'https://github.com/google/fonts/raw/main/ofl/sofiasansextracondensed/SofiaSansExtraCondensed%5Bwght%5D.ttf',
    dest: 'SofiaSansExtraCondensed-Black.ttf',
  },
  {
    url: 'https://github.com/google/fonts/raw/main/ofl/sofiasanssemicondensed/SofiaSansSemiCondensed%5Bwght%5D.ttf',
    dest: 'SofiaSansSemiCondensed-SemiBold.ttf',
  },
];

for (const f of FILES) {
  const dest = path.join(ROOT, f.dest);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
    console.log('exists', dest);
    continue;
  }
  const res = await fetch(f.url);
  if (!res.ok) {
    console.warn('skip', f.url, res.status);
    continue;
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log('wrote', dest);
}
