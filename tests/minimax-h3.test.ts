import { describe, it, expect } from 'vitest';
import type { VideoGenerateInput } from '@/lib/video-providers/types';
import {
  h3Duration,
  h3Resolution,
  h3Mode,
  h3Ratio,
  buildH3Content,
  buildH3RequestBody,
  parseH3Task,
  classifyH3Error,
  hasMinimaxH3,
} from '@/services/minimax-h3.service';

const http = 'https://cdn.example.com/a.png';
const http2 = 'https://cdn.example.com/b.png';
const http3 = 'https://cdn.example.com/c.png';

function input(partial: Partial<VideoGenerateInput> = {}): VideoGenerateInput {
  return { prompt: 'A boy playing basketball by the sea', ...partial };
}

describe('h3Duration', () => {
  it('defaults to 8, clamps to [4,15]', () => {
    expect(h3Duration(undefined)).toBe(8);
    expect(h3Duration(3)).toBe(4);
    expect(h3Duration(8)).toBe(8);
    expect(h3Duration(20)).toBe(15);
    expect(h3Duration(7.6)).toBe(8);
  });
});

describe('h3Resolution', () => {
  it('defaults to 2K, honours 768P', () => {
    expect(h3Resolution({})).toBe('2K');
    expect(h3Resolution({ MINIMAX_H3_RESOLUTION: '768P' })).toBe('768P');
    expect(h3Resolution({ MINIMAX_H3_RESOLUTION: '1080P' })).toBe('2K');
  });
});

describe('h3Mode', () => {
  it('picks t2va / i2va / r2va', () => {
    expect(h3Mode(input())).toBe('t2va');
    expect(h3Mode(input({ firstFrameUrl: http }))).toBe('i2va');
    expect(h3Mode(input({ firstFrameUrl: http, subjectReferences: [{ imageUrl: http2 }] }))).toBe('r2va');
    expect(h3Mode(input({ referenceImages: [http2] }))).toBe('r2va');
  });
});

describe('h3Ratio', () => {
  it('t2va never emits adaptive; i2va is always adaptive', () => {
    expect(h3Ratio('t2va', '16:9')).toBe('16:9');
    expect(h3Ratio('t2va', '9:16')).toBe('9:16');
    expect(h3Ratio('t2va', 'adaptive')).toBe('16:9');
    expect(h3Ratio('t2va', 'weird')).toBe('16:9');
    expect(h3Ratio('i2va', '16:9')).toBe('adaptive');
    expect(h3Ratio('r2va', '9:16')).toBe('9:16');
    expect(h3Ratio('r2va')).toBe('adaptive');
  });
});

describe('buildH3Content / buildH3RequestBody', () => {
  it('always starts with a non-empty text item', () => {
    const c = buildH3Content(input());
    expect(c[0]).toEqual({ type: 'text', text: 'A boy playing basketball by the sea' });
    expect(() => buildH3Content({ prompt: '   ' })).toThrow(/prompt is required/);
  });

  it('i2va emits first_frame and optional last_frame, never a reference_*', () => {
    const c = buildH3Content(input({ firstFrameUrl: http, lastFrameUrl: http2 }));
    expect(c.map((x) => x.role)).toEqual([undefined, 'first_frame', 'last_frame']);
    const body = buildH3RequestBody(input({ firstFrameUrl: http, durationSec: 8, aspectRatio: '16:9' }));
    expect(body.ratio).toBe('adaptive');
    expect(body.duration).toBe(8);
    expect(body.resolution).toBe('2K');
    const roles = (body.content as any[]).map((x) => x.role).filter(Boolean);
    expect(roles.some((r: string) => r.startsWith('reference_'))).toBe(false);
  });

  it('r2va demotes first frame to reference_image and never mixes first_frame', () => {
    const body = buildH3RequestBody(input({
      firstFrameUrl: http,
      subjectReferences: [{ imageUrl: http2, name: 'hero' }],
      referenceImages: [http3],
    }));
    const roles = (body.content as any[]).map((x) => x.role).filter(Boolean);
    expect(roles).toEqual(['reference_image', 'reference_image', 'reference_image']);
    expect(roles).not.toContain('first_frame');
    const urls = (body.content as any[]).filter((x) => x.type === 'image_url').map((x) => x.image_url.url);
    expect(urls[0]).toBe(http2);
    expect(urls).toContain(http);
  });

  it('caps references at 9 and dedupes', () => {
    const many = Array.from({ length: 12 }, (_, i) => `https://cdn.example.com/${i}.png`);
    const c = buildH3Content(input({
      firstFrameUrl: many[0],
      subjectReferences: [{ imageUrl: many[0] }],
      referenceImages: many,
    }));
    const imgs = c.filter((x) => x.type === 'image_url');
    expect(imgs).toHaveLength(9);
    expect(new Set(imgs.map((x) => x.image_url!.url)).size).toBe(9);
  });

  it('t2va body has a concrete ratio', () => {
    const body = buildH3RequestBody(input({ aspectRatio: '9:16', durationSec: 5 }));
    expect(body.ratio).toBe('9:16');
    expect(body.duration).toBe(5);
    expect((body.content as any[]).every((x) => x.type === 'text')).toBe(true);
  });
});

describe('parseH3Task', () => {
  it('reads succeeded url + usage', () => {
    const p = parseH3Task({
      task: {
        status: 'succeeded',
        content: { url: 'https://cdn.example.com/out.mp4' },
        duration: 5,
        resolution: '2K',
        usage: { total_seconds: 5, output_seconds: 5, input_image_count: 1 },
      },
    });
    expect(p.status).toBe('succeeded');
    expect(p.videoUrl).toContain('out.mp4');
    expect(p.totalSeconds).toBe(5);
    expect(p.usage?.input_image_count).toBe(1);
  });

  it('reads failed error', () => {
    const p = parseH3Task({
      task: { status: 'failed', error: { code: '1026', message: 'sensitive content' } },
    });
    expect(p.status).toBe('failed');
    expect(p.errorCode).toBe('1026');
    expect(p.errorMessage).toContain('sensitive');
  });

  it('normalises running', () => {
    expect(parseH3Task({ task: { status: 'Running' } }).status).toBe('running');
  });
});

describe('classifyH3Error', () => {
  it('marks 429/529/5xx retryable and 401/402 fatal', () => {
    expect(classifyH3Error(429, { error: { message: 'rate limit (1002)' } }).retryable).toBe(true);
    expect(classifyH3Error(529, { error: { message: 'overloaded' } }).retryable).toBe(true);
    expect(classifyH3Error(500, { error: { message: 'internal' } }).retryable).toBe(true);
    expect(classifyH3Error(400, { error: { message: 'bad params (2013)' } }).retryable).toBe(false);
    expect(classifyH3Error(401, { error: { message: 'login fail (1004)' } }).fatal).toBe(true);
    expect(classifyH3Error(402, { error: { message: 'insufficient balance (1008)' } }).fatal).toBe(true);
  });
});

describe('hasMinimaxH3', () => {
  it('needs a key and honours the kill switch', () => {
    expect(hasMinimaxH3({})).toBe(false);
    expect(hasMinimaxH3({ MINIMAX_API_KEY: 'sk-x' })).toBe(true);
    expect(hasMinimaxH3({ MINIMAX_API_KEY: 'sk-x', ENABLE_MINIMAX_H3: '0' })).toBe(false);
  });
});
