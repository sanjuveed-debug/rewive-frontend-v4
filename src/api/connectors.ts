import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { getCurrentUser } from './auth';
import type {
  ConnectorType,
  ConnectorTypeKey,
  CreateCustomConnectorTypeInput,
  DataConnection,
  ConnectionStatus,
  CreateConnectionInput,
} from './types';

// ---------------------------------------------------------------------------
// Connector type catalog
// ---------------------------------------------------------------------------
// REALITY GAP: the real backend exposes no GET /connector-types endpoint (or
// any persistence for connector types at all). This list is UI-only catalog
// metadata describing what a user CAN connect — icons, descriptions, and the
// dynamic config field forms — the same category as a static icon set or nav
// menu, not live user data. Real connection *records* still always come from
// GET /api/connections (see useConnections below).
const BASE_CONNECTOR_TYPES: ConnectorType[] = [
  {
    id: 'snowflake',
    name: 'Snowflake',
    icon: '❄️',
    description: 'Connect a Snowflake warehouse for live data pulls.',
    isCustom: false,
    fields: [
      { key: 'account', label: 'Account identifier', inputType: 'text', required: true },
      { key: 'warehouse', label: 'Warehouse', inputType: 'text', required: true },
      { key: 'username', label: 'Username', inputType: 'text', required: true },
      { key: 'password', label: 'Password', inputType: 'password', required: true },
    ],
  },
  {
    id: 'dynamics',
    name: 'Microsoft Dynamics 365',
    icon: '🧭',
    description: 'Sync finance and operations data from Dynamics 365.',
    isCustom: false,
    fields: [
      { key: 'tenant_url', label: 'Tenant URL', inputType: 'url', required: true },
      { key: 'client_id', label: 'Client ID', inputType: 'text', required: true },
      { key: 'client_secret', label: 'Client secret', inputType: 'password', required: true },
    ],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '☁️',
    description: 'Pull pipeline and account data from Salesforce.',
    isCustom: false,
    fields: [
      { key: 'instance_url', label: 'Instance URL', inputType: 'url', required: true },
      { key: 'username', label: 'Username', inputType: 'text', required: true },
      { key: 'password', label: 'Password', inputType: 'password', required: true },
      { key: 'security_token', label: 'Security token', inputType: 'password', required: false },
    ],
  },
  {
    id: 'sftp',
    name: 'SFTP',
    icon: '📁',
    description: 'Pull flat files from a secure SFTP endpoint.',
    isCustom: false,
    fields: [
      { key: 'host', label: 'Host', inputType: 'text', required: true },
      { key: 'port', label: 'Port', inputType: 'text', required: false },
      { key: 'username', label: 'Username', inputType: 'text', required: true },
      { key: 'password', label: 'Password', inputType: 'password', required: true },
      { key: 'path', label: 'Remote path', inputType: 'text', required: false },
    ],
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: '🗂️',
    description: 'Read spreadsheets and files from a connected OneDrive.',
    isCustom: false,
    fields: [
      { key: 'client_id', label: 'Client ID', inputType: 'text', required: true },
      { key: 'client_secret', label: 'Client secret', inputType: 'password', required: true },
      { key: 'folder_path', label: 'Folder path', inputType: 'text', required: false },
    ],
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    icon: '📚',
    description: 'Read lists and documents from a SharePoint site.',
    isCustom: false,
    fields: [
      { key: 'site_url', label: 'Site URL', inputType: 'url', required: true },
      { key: 'client_id', label: 'Client ID', inputType: 'text', required: true },
      { key: 'client_secret', label: 'Client secret', inputType: 'password', required: true },
    ],
  },
  {
    id: 'anaplan',
    name: 'Anaplan',
    icon: '📊',
    description: 'Sync planning models and modules from Anaplan.',
    isCustom: false,
    fields: [
      { key: 'workspace_id', label: 'Workspace ID', inputType: 'text', required: true },
      { key: 'model_id', label: 'Model ID', inputType: 'text', required: true },
      { key: 'username', label: 'Username', inputType: 'text', required: true },
      { key: 'password', label: 'Password', inputType: 'password', required: true },
    ],
  },
  {
    id: 'adaptive_planning',
    name: 'Adaptive Planning',
    icon: '📈',
    description: 'Sync budgets and actuals from Workday Adaptive Planning.',
    isCustom: false,
    fields: [
      { key: 'instance_url', label: 'Instance URL', inputType: 'url', required: true },
      { key: 'username', label: 'Username', inputType: 'text', required: true },
      { key: 'password', label: 'Password', inputType: 'password', required: true },
    ],
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'custom';
}

export function useConnectorTypes() {
  return useQuery({
    queryKey: ['connector-types'],
    // No real backend endpoint exists for this — resolve the static catalog
    // (plus any session-local custom types appended via useCreateCustomConnectorType)
    // through the normal useQuery loading/data lifecycle so consuming screens
    // don't need to change.
    queryFn: async () => BASE_CONNECTOR_TYPES,
    staleTime: Infinity,
  });
}

export function useCreateCustomConnectorType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCustomConnectorTypeInput): Promise<ConnectorType> => {
      // REALITY GAP: there is no real persistence endpoint for custom connector
      // types. This appends to the in-memory query cache for the current
      // session only — it will not survive a reload and is not shared across
      // users. No network call is made.
      const newType: ConnectorType = {
        id: `custom_${slugify(input.name)}_${Date.now().toString(36)}` as ConnectorTypeKey,
        name: input.name,
        icon: input.icon || '🔌',
        description: input.description,
        fields: input.fields,
        isCustom: true,
      };
      return newType;
    },
    onSuccess: (newType) => {
      queryClient.setQueryData<ConnectorType[]>(['connector-types'], (prev) =>
        prev ? [...prev, newType] : [newType]
      );
    },
  });
}

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------
interface RawConnection {
  id: string;
  name: string;
  type: string;
  status: string;
  is_default?: boolean;
  created_at: string;
  message?: string;
}

function mapStatus(raw: string): ConnectionStatus {
  if (raw === 'connected') return 'active';
  if (raw === 'error') return 'error';
  return raw as ConnectionStatus;
}

export function useConnections(filters: { status?: ConnectionStatus | 'all' } = {}) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['connections', filters],
    queryFn: async (): Promise<DataConnection[]> => {
      const { data } = await apiClient.get<{ connections: RawConnection[] }>('/api/connections');
      const knownTypes =
        queryClient.getQueryData<ConnectorType[]>(['connector-types']) ?? BASE_CONNECTOR_TYPES;
      const user = getCurrentUser();
      const owner = {
        name: user?.name ?? 'Unknown',
        // real /api/connections has no owner column — every connection is
        // attributed to the current session's user as a simplification.
        initials: (user?.name ?? 'U')
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join('') || 'U',
        avatarBg: '#6366f1',
      };

      const mapped: DataConnection[] = data.connections.map((c) => {
        const matchedType = knownTypes.find((t) => t.id === c.type);
        const status = mapStatus(c.status);
        return {
          id: c.id,
          connectorTypeId: (matchedType?.id ?? c.type) as ConnectorTypeKey,
          connectorTypeName: matchedType?.name ?? c.type,
          name: c.name,
          status,
          owner,
          createdDate: c.created_at,
          lastSyncedAt: null,
          config: {},
          errorMessage: status === 'error' ? c.message ?? 'Connection error' : undefined,
        };
      });

      if (!filters.status || filters.status === 'all') return mapped;
      return mapped.filter((c) => c.status === filters.status);
    },
  });
}

export function useApprovedConnections() {
  const { data, ...rest } = useConnections();
  // Real connections have no separate 'approved' state — they are 'active'
  // (or 'error') the moment they're created. Kept filtering on both values
  // for compatibility with callers written against the old workflow.
  return {
    ...rest,
    data: data?.filter((c) => c.status === 'approved' || c.status === 'active'),
  };
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateConnectionInput) => {
      const { data } = await apiClient.post<{ connection: RawConnection; status: string }>(
        '/api/connections',
        { name: input.name, type: input.connectorTypeId, config: input.config }
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete<{ ok: boolean }>(`/api/connections/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: async (id: string) =>
      (await apiClient.post<{ status: string; message?: string }>(`/api/connections/${id}/test`)).data,
  });
}

// ---------------------------------------------------------------------------
// Approve / reject — REALITY GAP
// ---------------------------------------------------------------------------
// The real backend has no pending/approved/rejected workflow: a connection is
// either 'connected' (-> mapped to 'active') or 'error' the moment it's
// created via POST /api/connections or .../test. Nothing is ever really
// 'pending' server-side, so there is no endpoint to call here. These stay
// exported (so existing imports/UI don't break) but are now client-side
// no-ops that just refetch the connections list — every real connection is
// already effectively active on creation, so approving/rejecting a
// (never-occurring) pending row has nothing real to do.
export function useApproveConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => Promise.resolve(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  });
}

export function useRejectConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_id: string) => Promise.resolve(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] }),
  });
}
