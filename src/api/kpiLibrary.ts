import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  CustomKpiInput,
  KpiCatalogEntry,
  KpiCategory,
  KpiDriver,
  KpiSegment,
  PlanningImportResult,
  TrackedKpi,
  TrackedKpiDataStatus,
  TrackedKpiSource,
} from './types';

// The real backend returns drivers_needed as a plain string[] (driver keys like
// "net_revenue", "cogs"), not the {name, dataSource} shape types.ts declares.
// Normalize defensively so the UI never renders "undefined".
function mapDriver(raw: unknown): KpiDriver {
  if (typeof raw === 'string') return { name: raw, dataSource: '' };
  const d = raw as { name?: string; dataSource?: string; data_source?: string };
  return { name: d?.name ?? String(raw), dataSource: d?.dataSource ?? d?.data_source ?? '' };
}

function mapCatalogEntry(raw: any): KpiCatalogEntry {
  return {
    id: raw.id,
    name: raw.name,
    segment: raw.segment as KpiSegment,
    category: raw.category as KpiCategory,
    definition: raw.definition,
    formula: raw.formula,
    driversNeeded: (raw.drivers_needed ?? []).map(mapDriver),
  };
}

function mapTrackedKpi(raw: any): TrackedKpi {
  // The real /tracked payload has no `segment` field at all. For catalog-sourced
  // rows, `category` mirrors the catalog's segment value (e.g. "cash"), so reuse
  // it as segment; for custom/planning_import rows category is "custom" — no
  // real segment exists there, so leave it null rather than guessing.
  return {
    id: raw.id,
    name: raw.name,
    segment: raw.source === 'catalog' ? (raw.category as KpiSegment) : null,
    category: (raw.category as KpiCategory) ?? null,
    source: raw.source as TrackedKpiSource,
    driversNeeded: (raw.drivers_needed ?? []).map(mapDriver),
    dataStatus: raw.data_status as TrackedKpiDataStatus,
    addedAt: raw.added_at,
  };
}

export function useKpiCatalog(segment?: KpiSegment | 'all') {
  return useQuery({
    queryKey: ['kpi-catalog', segment],
    queryFn: async () => {
      const params = segment && segment !== 'all' ? { segment } : undefined;
      const { data } = await apiClient.get<{ catalog: any[] }>('/api/kpi-library/catalog', { params });
      return data.catalog.map(mapCatalogEntry);
    },
  });
}

export function useTrackedKpis() {
  return useQuery({
    queryKey: ['tracked-kpis'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ tracked: any[] }>('/api/kpi-library/tracked');
      return data.tracked.map(mapTrackedKpi);
    },
  });
}

export function useTrackKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kpiId: string) => {
      const { data } = await apiClient.post<{ tracked_kpi: any }>('/api/kpi-library/tracked', { kpi_catalog_id: kpiId });
      return mapTrackedKpi(data.tracked_kpi);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracked-kpis'] }),
  });
}

export function useAddCustomKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CustomKpiInput) => {
      // Real backend expects `drivers` as string[] (driver names), not
      // {name, dataSource} objects — flatten before sending.
      const { data } = await apiClient.post<{ tracked_kpi: any }>('/api/kpi-library/tracked/custom', {
        name: input.name,
        drivers: input.drivers.map((d) => d.name),
      });
      return mapTrackedKpi(data.tracked_kpi);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracked-kpis'] }),
  });
}

export function useUntrackKpi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiClient.delete(`/api/kpi-library/tracked/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracked-kpis'] }),
  });
}

export function useImportPlanningData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      // Real endpoint lives under /connections, not /kpi-library, and returns
      // driversImported as a plain count (number) with no budget-lines data at
      // all — there is no budget-import feature on the real backend. Adapt the
      // count into a single real, non-fabricated summary line rather than
      // inventing per-driver names/values or budget lines that don't exist.
      const { data } = await apiClient.post<{
        connectionId: string;
        connectorName: string;
        driversImported: number;
        importedAt: string;
      }>(`/api/connections/${connectionId}/import-planning-data`);

      const result: PlanningImportResult = {
        connectionId: data.connectionId,
        connectorName: data.connectorName,
        driversImported: [{ name: 'Columns imported as tracked KPIs', value: String(data.driversImported) }],
        budgetLinesImported: [],
        importedAt: data.importedAt,
      };
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracked-kpis'] }),
  });
}
