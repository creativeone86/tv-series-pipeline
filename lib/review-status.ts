/**
 * Project version approval state machine. Async via getDbDriver()
 * so Postgres-backed projects actually persist review state.
 */

import { getDbDriver } from '@/lib/db-driver';

export type ReviewStatus = 'draft' | 'in_review' | 'approved' | 'changes_requested';

export interface ProjectReviewStatus {
  projectId: string;
  status: ReviewStatus;
  submittedByUserId: string | null;
  submittedAt: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  updatedAt: string;
}

interface ReviewDbRow {
  project_id: string;
  status: string;
  submitted_by_user_id: string | null;
  submitted_at: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  updated_at: string;
}

function rowToStatus(row: ReviewDbRow): ProjectReviewStatus {
  return {
    projectId: row.project_id,
    status: row.status as ReviewStatus,
    submittedByUserId: row.submitted_by_user_id,
    submittedAt: row.submitted_at,
    reviewedByUserId: row.reviewed_by_user_id,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    updatedAt: row.updated_at,
  };
}

const ALLOWED_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  draft: ['in_review'],
  in_review: ['approved', 'changes_requested', 'draft'],
  approved: ['draft'],
  changes_requested: ['in_review', 'draft'],
};

function emptyStatus(projectId: string): ProjectReviewStatus {
  return {
    projectId,
    status: 'draft',
    submittedByUserId: null,
    submittedAt: null,
    reviewedByUserId: null,
    reviewedAt: null,
    reviewNote: null,
    updatedAt: new Date().toISOString(),
  };
}

export async function getReviewStatus(projectId: string): Promise<ProjectReviewStatus> {
  const row = await getDbDriver().get<ReviewDbRow>(
    'SELECT * FROM project_review_status WHERE project_id = ?',
    [projectId],
  );
  if (row) return rowToStatus(row);
  return emptyStatus(projectId);
}

export interface TransitionInput {
  projectId: string;
  toStatus: ReviewStatus;
  actorUserId: string;
  note?: string;
}

export interface TransitionResult {
  ok: boolean;
  status?: ProjectReviewStatus;
  error?: string;
}

export async function transitionReviewStatus(input: TransitionInput): Promise<TransitionResult> {
  const current = await getReviewStatus(input.projectId);
  const allowed = ALLOWED_TRANSITIONS[current.status] || [];
  if (!allowed.includes(input.toStatus)) {
    return {
      ok: false,
      error: `非法状态转换: ${current.status} → ${input.toStatus} (允许: ${allowed.join('|') || '无'})`,
    };
  }

  if (
    (input.toStatus === 'approved' || input.toStatus === 'changes_requested')
    && current.submittedByUserId === input.actorUserId
  ) {
    return { ok: false, error: '不能自审自己提交的版本' };
  }

  const note = (input.note || '').trim().slice(0, 500);
  if (input.toStatus === 'changes_requested' && !note) {
    return { ok: false, error: 'request_changes 时必须填留言, 告诉提交者改哪里' };
  }

  const ts = new Date().toISOString();
  let submittedByUserId = current.submittedByUserId;
  let submittedAt = current.submittedAt;
  let reviewedByUserId = current.reviewedByUserId;
  let reviewedAt = current.reviewedAt;
  let reviewNote = current.reviewNote;

  if (input.toStatus === 'in_review') {
    submittedByUserId = input.actorUserId;
    submittedAt = ts;
    reviewedByUserId = null;
    reviewedAt = null;
    reviewNote = null;
  } else if (input.toStatus === 'approved' || input.toStatus === 'changes_requested') {
    reviewedByUserId = input.actorUserId;
    reviewedAt = ts;
    reviewNote = note || null;
  } else if (input.toStatus === 'draft') {
    reviewedByUserId = null;
    reviewedAt = null;
    reviewNote = note || null;
  }

  await getDbDriver().run(
    `INSERT INTO project_review_status
      (project_id, status, submitted_by_user_id, submitted_at, reviewed_by_user_id, reviewed_at, review_note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
      status = excluded.status,
      submitted_by_user_id = excluded.submitted_by_user_id,
      submitted_at = excluded.submitted_at,
      reviewed_by_user_id = excluded.reviewed_by_user_id,
      reviewed_at = excluded.reviewed_at,
      review_note = excluded.review_note,
      updated_at = excluded.updated_at`,
    [
      input.projectId, input.toStatus, submittedByUserId, submittedAt,
      reviewedByUserId, reviewedAt, reviewNote, ts,
    ],
  );

  return { ok: true, status: await getReviewStatus(input.projectId) };
}
