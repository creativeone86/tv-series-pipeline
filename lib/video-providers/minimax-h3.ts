/**
 * MiniMax-H3 视频 provider。capability 全开(t2v / i2v / last-frame / subject ref)。
 * 不声明 supportsNativeAudio —— TTS 归 ElevenLabs,避免 isNativeAudioProvider 跳过配音。
 */
import { registerVideoProvider } from './registry';
import type { VideoGenerateInput } from './types';
import { hasMinimaxH3 } from '@/services/minimax-h3.service';

registerVideoProvider({
  id: 'minimax-h3',
  name: 'MiniMax H3 (t2v / i2v / reference)',
  priority: 40,
  supportsImage2Video: true,
  supportsText2Video: true,
  supportsLastFrame: true,
  supportsSubjectReference: true,
  maxDurationSec: 15,
  available: () => hasMinimaxH3(),
  async generate(input: VideoGenerateInput) {
    const { MinimaxH3Service } = await import('@/services/minimax-h3.service');
    const svc = new MinimaxH3Service();
    const r = await svc.generateVideo(input);
    if (!r.videoUrl) throw new Error('minimax-h3 returned empty url');
    return {
      videoUrl: r.videoUrl,
      provider: 'minimax-h3',
      durationSec: r.totalSeconds,
      upstreamId: r.taskId,
    };
  },
});
