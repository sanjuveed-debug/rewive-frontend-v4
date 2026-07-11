import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  QuickSolution,
  SolutionDesign,
  SolutionTask,
  SolutionTaskStatus,
  SolutionTaskType,
  TaskChannel,
  TaskComment,
  ValidationReview,
} from './types';

// ---------------------------------------------------------------------------
// Real backend response shapes (snake_case) — see POST/GET /api/solutions*.
// ---------------------------------------------------------------------------
interface ApiTaskListItem {
  id: string;
  solution_design_id: string;
  type: SolutionTaskType;
  title: string;
  status: string;
  channel: TaskChannel | null;
  real_task_id: string | null;
  real_agent_spec_id: string | null;
  real_agent_id: string | null;
  created_at: string;
}

interface ApiSolution {
  id: string;
  finding_id: string;
  status: SolutionDesign['status'];
  approach: string;
  data_needed: string;
  owner_id: string | null;
  guardrails: string;
  copied_from_label: string | null;
  validation: ValidationReview | null;
  created_at: string;
  updated_at: string;
  taskList: ApiTaskListItem[];
}

interface ApiUser {
  id: string;
  name: string;
}

// fpa_tasks row — the same real table backs "Operate → Tasks".
interface ApiTask {
  id: string;
  title: string;
  description: string | null;
  status: 'Created' | 'Assigned' | 'Accepted' | 'In Progress' | 'Completed' | 'Declined' | 'Overdue';
  assigned_to: string | null;
  assigned_to_name: string | null;
  source_solution_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Shared helpers (owner resolution, avatar generation — same pattern used
// throughout src/api/*.ts, duplicated per-file rather than shared).
// ---------------------------------------------------------------------------
const AVATAR_COLORS = ['#4f7cff', '#00b894', '#e17055', '#6c5ce7', '#00cec9', '#fdcb6e', '#e84393'];

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
}

function avatarBgFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

async function resolveOwner(ownerId: string | null): Promise<SolutionDesign['owner']> {
  if (!ownerId) return { name: 'Unassigned', initials: 'U', avatarBg: avatarBgFor('Unassigned') };
  try {
    const res = await apiClient.get<{ users: ApiUser[] }>('/api/users');
    const user = res.data.users.find((u) => u.id === ownerId);
    const name = user?.name ?? 'Unassigned';
    return { name, initials: initialsFor(name), avatarBg: avatarBgFor(name) };
  } catch {
    return { name: 'Unassigned', initials: 'U', avatarBg: avatarBgFor('Unassigned') };
  }
}

// The real backend has no signal concept in v4 — every solution design is
// finding-based. We fetch the finding's title to populate `signalName`, and
// use `finding_id` as `signalId` (the closest real analog to the mock's
// signal-based field name — see module notes below).
async function fetchFindingTitle(findingId: string): Promise<string> {
  try {
    const res = await apiClient.get(`/api/findings/${findingId}`);
    return res.data?.title ?? findingId;
  } catch {
    return findingId;
  }
}

const KNOWN_TASK_STATUSES: SolutionTaskStatus[] = ['proposed', 'needs_review', 'confirmed', 'in_progress', 'done'];
function asTaskStatus(status: string): SolutionTaskStatus {
  return (KNOWN_TASK_STATUSES as string[]).includes(status) ? (status as SolutionTaskStatus) : 'proposed';
}

function mapTaskListItem(raw: ApiTaskListItem, ownerName: string): SolutionTask {
  return {
    id: raw.id,
    type: raw.type,
    title: raw.title,
    // The real taskList item has no per-task owner field pre-approval — fall
    // back to the solution design's own owner as the closest real analog.
    owner: ownerName,
    status: asTaskStatus(raw.status),
    channel: raw.channel ?? 'app',
    comments: [],
    agentSpecId: raw.real_agent_spec_id ?? undefined,
    solutionId: raw.solution_design_id,
    solutionName: undefined,
  };
}

async function mapSolution(raw: ApiSolution): Promise<SolutionDesign> {
  const [owner, signalName] = await Promise.all([resolveOwner(raw.owner_id), fetchFindingTitle(raw.finding_id)]);
  return {
    id: raw.id,
    // v4 has no signal concept — finding_id is the closest real analog to the
    // mock's signalId. See "signal-vs-finding" note in module comments.
    signalId: raw.finding_id,
    signalName,
    // Not tracked on the real Finding (which has `severity`, not a signal
    // category) — 'other' is a safe default since this field is not
    // rendered anywhere in the SolutionDesign/Tasks screens.
    signalCategory: 'other',
    status: raw.status,
    approach: raw.approach,
    dataNeeded: raw.data_needed,
    owner,
    guardrails: raw.guardrails,
    copiedFromLabel: raw.copied_from_label,
    taskList: (raw.taskList ?? []).map((t) => mapTaskListItem(t, owner.name)),
    validation: raw.validation ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function useSolutionDesign(id: string | undefined) {
  return useQuery({
    queryKey: ['solutions', id],
    queryFn: async () => mapSolution((await apiClient.get<ApiSolution>(`/api/solutions/${id}`)).data),
    enabled: !!id,
  });
}

// Kept for compatibility with the legacy signal flow (src/screens/SignalDetail,
// out of this pass's scope) which still calls this with a signal/finding id.
// The real backend has no signal-based creation — this posts finding_id
// directly (finding-based is the only creation path that exists server-side).
// Note: in the current v4 routing, this hook is largely unused in practice —
// Findings → "act" disposition already creates the solution design
// server-side and the SolutionDesign screen reaches it via the resulting
// `solutionDesignId`, not by calling this endpoint.
export function useCreateSolutionDesign() {
  return useMutation({
    mutationFn: async (findingId: string) =>
      mapSolution((await apiClient.post<ApiSolution>('/api/solutions', { finding_id: findingId })).data),
  });
}

function useSolutionMutation(id: string, path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body?: Record<string, unknown>) =>
      mapSolution((await apiClient.post<ApiSolution>(`/api/solutions/${id}${path}`, body)).data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['solutions', id], updated);
    },
  });
}

// Real endpoint is POST /api/solutions/{id}/copy body {fromSolutionId}. The
// "prior solutions for similar signals" card that drives this (SolutionDesign
// screen) sources candidate ids from src/api/signalStudio.ts's SimilarSignalMatch,
// which is legacy v3 data with no real backend endpoint of its own (still
// pointing at mock-only `/signals/*` paths, out of this pass's scope) — so in
// practice this card rarely renders against the real backend. We still wire
// the mutation itself correctly so it works whenever a real solution id is
// available.
export function useCopySolution(id: string) {
  return useSolutionMutation(id, '/copy');
}

// The real /run-validation response is already camelCase (pros/cons/expectedRoi/
// expectedCost/timeToValue/recommendation/recommendationReason) per the backend
// router's own design — no snake_case mapping needed for `validation` itself.
export function useRunValidation(id: string) {
  return useSolutionMutation(id, '/run-validation');
}

export function useSendForApproval(id: string) {
  return useSolutionMutation(id, '/send-for-approval');
}

export function useApproveSolution(id: string) {
  return useSolutionMutation(id, '/approve');
}

// Real, additive endpoint (beyond the original mock contract) for populating
// the task list before approval. Not currently wired into the SolutionDesign
// screen's UI (which has no "add task" affordance), but exposed here for
// completeness / future use.
export function useAddSolutionTask(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { type: SolutionTaskType; title: string; agentId?: string }) =>
      mapSolution((await apiClient.post<ApiSolution>(`/api/solutions/${id}/tasks`, vars)).data),
    onSuccess: (updated) => queryClient.setQueryData(['solutions', id], updated),
  });
}

// ---------- Solution in hand (fast path — reviewer already has a fix) ----------
// The real backend has NO quick-solution concept at all — /api/solutions is
// finding-based only. These hooks have no real endpoint to call, so they
// throw a clear, actionable error instead of silently hitting a 404. The
// consuming UI (src/screens/SignalDetail/QuickSolutionPanel.tsx) is out of
// this pass's scope to edit, so it isn't hidden here — but any attempt to
// use it will now fail loudly with this message rather than a confusing
// network error.
const QUICK_SOLUTION_UNSUPPORTED =
  'Not supported — quick solutions require the legacy signal flow which has been retired.';

export function useCreateQuickSolution() {
  return useMutation({
    mutationFn: async (_vars: { signalId: string; description: string }): Promise<QuickSolution> => {
      throw new Error(QUICK_SOLUTION_UNSUPPORTED);
    },
  });
}

export function useQuickSolution(id: string | undefined) {
  return useQuery({
    queryKey: ['quick-solutions', id],
    queryFn: async (): Promise<QuickSolution> => {
      throw new Error(QUICK_SOLUTION_UNSUPPORTED);
    },
    enabled: false && !!id,
    retry: false,
  });
}

export function useConfirmQuickSolution(_id: string) {
  return useMutation({
    mutationFn: async (): Promise<QuickSolution> => {
      throw new Error(QUICK_SOLUTION_UNSUPPORTED);
    },
  });
}

// ---------- Tasks (assigned across all solution designs, "Operate → Tasks") ----------
// The real /api/tasks is the same fpa_tasks table used elsewhere in the app —
// not the mock's separate SolutionTask concept with type/channel/comments.
// Every real task is mapped as a 'human_task' (the real table doesn't
// distinguish new_agent/existing_agent/human_task).
function mapTaskRealStatus(status: ApiTask['status']): SolutionTaskStatus {
  switch (status) {
    case 'Created':
      return 'proposed';
    case 'Assigned':
      return 'needs_review';
    case 'Accepted':
      return 'confirmed';
    case 'In Progress':
      return 'in_progress';
    case 'Completed':
      return 'done';
    case 'Declined':
      // Shown as done rather than filtered out — a declined task is
      // concluded, not silently hidden.
      return 'done';
    case 'Overdue':
      // Still needs attention — closest fit in the UI's vocabulary.
      return 'needs_review';
    default:
      return 'proposed';
  }
}

// Inverse mapping used when the UI's "Move to <stage>" button posts a status
// change. Only the four stages the Tasks screen's advance-flow button cycles
// through (proposed → needs_review → in_progress → done) are reachable this
// way; 'confirmed'/Accepted is a real-world state reached outside this UI
// (e.g. the assignee accepting elsewhere), so it maps to 'Accepted' for
// completeness but isn't part of the UI's own advance sequence.
function uiStatusToReal(status: SolutionTaskStatus): ApiTask['status'] {
  switch (status) {
    case 'proposed':
      return 'Created';
    case 'needs_review':
      return 'Assigned';
    case 'confirmed':
      return 'Accepted';
    case 'in_progress':
      return 'In Progress';
    case 'done':
      return 'Completed';
  }
}

function mapTask(raw: ApiTask): SolutionTask {
  return {
    id: raw.id,
    type: 'human_task',
    title: raw.title,
    owner: raw.assigned_to_name ?? 'Unassigned',
    status: mapTaskRealStatus(raw.status),
    // No real channel data — the source UI itself labels Teams/Slack/
    // ServiceNow as preview-only, so we don't fake a working integration.
    channel: 'app',
    // Real comments live at a separate endpoint (GET /api/tasks/{id}/comments)
    // — fetched per-task via useTaskComments in the Tasks screen rather than
    // eagerly here.
    comments: [],
    solutionId: raw.source_solution_id ?? undefined,
    solutionName: undefined,
  };
}

export function useTasks(status?: SolutionTaskStatus | 'all') {
  return useQuery({
    queryKey: ['tasks', status],
    queryFn: async () => {
      const res = await apiClient.get<{ tasks: ApiTask[] }>('/api/tasks');
      const mapped = (res.data.tasks ?? []).map(mapTask);
      return status && status !== 'all' ? mapped.filter((t) => t.status === status) : mapped;
    },
  });
}

function mapTaskComment(raw: any): TaskComment {
  return {
    id: String(raw.id),
    authorName: raw.author_name ?? raw.authorName ?? 'Unknown',
    text: raw.comment ?? raw.text ?? '',
    createdAt: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  };
}

// Real, per-task comment thread — separate from the Solution Design's own
// task list. Fetched on demand by the Tasks screen so each TaskRow shows its
// real comments rather than the always-empty `comments` from useTasks().
export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['tasks', taskId, 'comments'],
    queryFn: async (): Promise<TaskComment[]> => {
      const res = await apiClient.get<any>(`/api/tasks/${taskId}/comments`);
      const raw: any[] = Array.isArray(res.data) ? res.data : res.data?.comments ?? [];
      return raw.map(mapTaskComment);
    },
    enabled: !!taskId,
  });
}

export function useAddTaskFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { taskId: string; text: string }) =>
      (await apiClient.post(`/api/tasks/${vars.taskId}/comments`, { comment: vars.text })).data,
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', vars.taskId, 'comments'] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { taskId: string; status: SolutionTaskStatus }) =>
      (await apiClient.put(`/api/tasks/${vars.taskId}/status`, { status: uiStatusToReal(vars.status) })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

// No real endpoint exists for updating a task's notification channel — the
// source UI itself labels Teams/Slack/ServiceNow "preview only, not yet
// wired to a real channel". This stays a client-only, in-session cache
// update (no network call) so the UI still reflects the change was made,
// without pretending it persists server-side.
export function useUpdateTaskChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { taskId: string; channel: TaskChannel }) => vars,
    onSuccess: (vars) => {
      queryClient.setQueriesData<SolutionTask[]>({ queryKey: ['tasks'] }, (old) =>
        old?.map((t) => (t.id === vars.taskId ? { ...t, channel: vars.channel } : t))
      );
    },
  });
}
