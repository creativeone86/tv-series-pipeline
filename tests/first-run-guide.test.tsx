// @vitest-environment jsdom
/**
 * v10.5.3 — 首跑引导组件单测:首跑显示+曝光埋点、三步推进、完成/跳过落 localStorage、
 * 已完成不再弹且零请求。jsdom 无布局(rect 全 0)→ 走居中兜底分支。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FirstRunGuide } from '@/components/create/first-run-guide';

const DONE_KEY = 'qfmj-create-guide-done';

function trackedEvents(f: ReturnType<typeof vi.spyOn>): string[] {
  return (f.mock.calls as any[]).map(([, init]) => JSON.parse(init.body).event);
}

describe('FirstRunGuide(v10.5.3)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    localStorage.clear();
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}'));
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('首跑:显示第 1 步 + 曝光埋点;三步推进逐步埋点;最后一步「开拍」完成', async () => {
    render(<FirstRunGuide />);
    await waitFor(() => expect(screen.getByText('① Write your idea')).toBeTruthy());
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('② Pick a look')).toBeTruthy();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('③ ROLL')).toBeTruthy();
    fireEvent.click(screen.getByText('Roll 🎬'));
    expect(localStorage.getItem(DONE_KEY)).toBe('1');
    await waitFor(() => {
      const evs = trackedEvents(fetchSpy);
      expect(evs).toEqual(['create_guide_shown', 'create_guide_step2', 'create_guide_step3', 'create_guide_completed']);
    });
  });

  it('跳过:落 localStorage + skipped 埋点', async () => {
    render(<FirstRunGuide />);
    await waitFor(() => expect(screen.getByText('Skip guide')).toBeTruthy());
    fireEvent.click(screen.getByText('Skip guide'));
    expect(localStorage.getItem(DONE_KEY)).toBe('1');
    await waitFor(() => expect(trackedEvents(fetchSpy)).toContain('create_guide_skipped'));
  });

  it('已完成:不渲染、零埋点请求', async () => {
    localStorage.setItem(DONE_KEY, '1');
    const { container } = render(<FirstRunGuide />);
    await new Promise((r) => setTimeout(r, 30));
    expect(container.textContent).toBe('');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('上一步可回退', async () => {
    render(<FirstRunGuide />);
    await waitFor(() => expect(screen.getByText('① Write your idea')).toBeTruthy());
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('① Write your idea')).toBeTruthy();
  });
});
