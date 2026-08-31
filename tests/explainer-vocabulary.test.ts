import { describe, expect, it } from 'vitest';
import { nanoid } from 'nanoid';
import { db, now } from '@/lib/db';
import { findVocabulary, isEntityLocked, promoteToVocabulary, setVocabularyLock } from '@/lib/explainer/vocabulary-repo';

function seedUser(): string {
  const id = 'u-' + nanoid();
  db.prepare(`INSERT INTO users (id, email, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, 'user', ?)`)
    .run(id, `${id}@test.local`, 'x', id, now());
  return id;
}

describe('narrated-explainer · visual vocabulary', () => {
  it('promotes, versions, locks, and ranks by entity id', async () => {
    const userId = seedUser();
    const projectId = 'proj-' + nanoid(6);
    const first = await promoteToVocabulary({
      userId,
      projectId,
      imageUrl: 'https://example.com/earth-v1.png',
      canonicalEntityId: 'EARTH',
      visualFunction: 'OBJECT',
      scope: 'SERIES',
      seriesId: 'ti-da-vidish',
      category: 'PHYSICS',
    });
    expect(first.metadata).toBeTruthy();
    const hits = await findVocabulary(userId, { entityId: 'EARTH', seriesId: 'ti-da-vidish' });
    expect(hits[0]?.vocabulary.canonicalEntityId).toBe('EARTH');
    expect(hits[0]?.vocabulary.version).toBe(1);

    const second = await promoteToVocabulary({
      userId,
      projectId,
      imageUrl: 'https://example.com/earth-v2.png',
      canonicalEntityId: 'EARTH',
      seriesId: 'ti-da-vidish',
    });
    expect((second.metadata as any).vocabulary.version).toBe(2);

    const locked = await setVocabularyLock(userId, second.id, true);
    expect((locked?.metadata as any).vocabulary.locked).toBe(true);
    expect(isEntityLocked([{ vocabulary: (locked!.metadata as any).vocabulary }], 'EARTH')).toBe(true);
  });
});
