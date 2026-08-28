'use client';

import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast-provider';
import { useProjectWorkspaceStore } from '@/lib/store';
import { useLocale } from '@/hooks/use-locale';

/**
 * Global workspace hotkeys. Mounted inside CreationWorkspace; renders no UI.
 *
 *   Ctrl/Cmd + S  → save current project (persist /api/projects/:id — already auto-saved; toast only)
 *   Ctrl/Cmd + Z  → undo last node edit (store.undo(), only if an undo stack exists)
 *   Space         → play/pause the selected video (video-modal listens for playRequested)
 *   ?             → shortcut help toast
 */
export function WorkspaceHotkeys() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const router = useRouter();
  const currentProject = useProjectWorkspaceStore(s => s.currentProject);

  // Ctrl/Cmd + S — save toast (auto-save is already handled by the store)
  useHotkeys('mod+s', (e) => {
    e.preventDefault();
    showToast({ title: t.product.saved, type: 'success', duration: 2000 });
  }, { enableOnFormTags: false });

  // Ctrl/Cmd + Z — try undo
  useHotkeys('mod+z', (e) => {
    e.preventDefault();
    const store: any = useProjectWorkspaceStore.getState();
    if (typeof store.undo === 'function') {
      store.undo();
      showToast({ title: t.product.undone, type: 'info', duration: 1500 });
    } else {
      showToast({ title: t.product.nothingToUndo, type: 'info', duration: 1500 });
    }
  }, { enableOnFormTags: false });

  // Space — broadcast play/pause; VideoModal and others listen
  useHotkeys('space', (e) => {
    const target = e.target as HTMLElement | null;
    // Do not intercept Space inside form fields
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (target?.isContentEditable) return;
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('workspace:togglePlay'));
  }, { enableOnFormTags: false });

  // ? — shortcut help
  useHotkeys('shift+/', (e) => {
    e.preventDefault();
    showToast({
      title: t.product.hotkeys,
      description: t.product.hotkeysDesc,
      type: 'info', duration: 6000,
    });
  });

  // Ctrl/Cmd + E — open export
  useHotkeys('mod+e', (e) => {
    e.preventDefault();
    if (!currentProject) return;
    window.open(`/api/projects/${currentProject.id}/export?type=mp4`, '_blank');
  }, { enableOnFormTags: false });

  // Keep unused router — reserved for later nav shortcuts (e.g. Ctrl+P switch project)
  void router;

  return null;
}
