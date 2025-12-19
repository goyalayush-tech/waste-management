import type { Claim, ClaimDocument, AuditTask, AuditRunResponse } from './types';

const BASE_URL = '/api/v1/claimclean';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchClaims(): Promise<{ success: boolean; data: Claim[] }> {
  const response = await fetch(`${BASE_URL}/claims`);
  return handleResponse<{ success: boolean; data: Claim[] }>(response);
}

export async function fetchClaim(claimId: string): Promise<{ success: boolean; data: Claim }> {
  const response = await fetch(`${BASE_URL}/claims/${claimId}`);
  return handleResponse<{ success: boolean; data: Claim }>(response);
}

export async function createClaim(payload: Partial<Claim>): Promise<{ success: boolean; data: Claim }> {
  const response = await fetch(`${BASE_URL}/claims`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ success: boolean; data: Claim }>(response);
}

export async function uploadDocument(claimId: string, file: File, docType: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('docType', docType);
  const response = await fetch(`${BASE_URL}/claims/${claimId}/documents`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<{ success: boolean; data: ClaimDocument }>(response);
}

export async function runAudit(claimId: string) {
  const response = await fetch(`${BASE_URL}/claims/${claimId}/audit/run`, {
    method: 'POST',
  });
  return handleResponse<{ success: boolean; data: AuditRunResponse }>(response);
}

export async function fetchAuditReport(claimId: string) {
  const response = await fetch(`${BASE_URL}/claims/${claimId}/report`);
  return handleResponse<{ success: boolean; data: any }>(response);
}

export async function listAuditTasks() {
  const response = await fetch(`${BASE_URL}/audits`);
  return handleResponse<{ success: boolean; data: AuditTask[] }>(response);
}

export async function queueFieldAudit(payload: { claimId: string; assignedTo?: string }) {
  const response = await fetch(`${BASE_URL}/audits/field`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ success: boolean; data: AuditTask }>(response);
}

export async function completeFieldAudit(taskId: string, body: { score?: number; issues?: any[]; details?: any; claimStatus?: string }) {
  const response = await fetch(`${BASE_URL}/audits/${taskId}/field/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<{ success: boolean; data: AuditTask }>(response);
}

// =====================
// Dashboard Stats APIs
// =====================

export interface DashboardStats {
  totalClaims: number;
  verifiedClaims: number;
  pendingClaims: number;
  rejectedClaims: number;
  auditingClaims: number;
  totalWeightKg: number;
  totalWeightTonnes: string;
  averageScore: number;
  pendingAudits: number;
  fieldAudits: number;
  openIssues: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
  totalWeightKg: number;
}

export interface TrendData {
  date: string;
  claims: number;
  weightKg: number;
  verified: number;
}

export interface RecyclerData {
  recyclerId: string;
  claimCount: number;
  totalWeightKg: number;
  verifiedWeightKg: number;
  averageScore: number | null;
}

export interface BrandData {
  brandId: string;
  claimCount: number;
  totalWeightKg: number;
  verifiedClaims: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
  avgWeightKg: number;
}

export interface TonnageData {
  month: string;
  totalTonnes: string;
  verifiedTonnes: string;
  claims: number;
}

export async function fetchDashboardStats(): Promise<{ success: boolean; data: DashboardStats }> {
  const response = await fetch(`${BASE_URL}/stats/summary`);
  return handleResponse<{ success: boolean; data: DashboardStats }>(response);
}

export async function fetchStatusBreakdown(): Promise<{ success: boolean; data: StatusBreakdown[] }> {
  const response = await fetch(`${BASE_URL}/stats/by-status`);
  return handleResponse<{ success: boolean; data: StatusBreakdown[] }>(response);
}

export async function fetchTrends(period: string = '30d'): Promise<{ success: boolean; data: TrendData[] }> {
  const response = await fetch(`${BASE_URL}/stats/trends?period=${period}`);
  return handleResponse<{ success: boolean; data: TrendData[] }>(response);
}

export async function fetchRecyclerStats(limit: number = 10): Promise<{ success: boolean; data: RecyclerData[] }> {
  const response = await fetch(`${BASE_URL}/stats/by-recycler?limit=${limit}`);
  return handleResponse<{ success: boolean; data: RecyclerData[] }>(response);
}

export async function fetchBrandStats(): Promise<{ success: boolean; data: BrandData[] }> {
  const response = await fetch(`${BASE_URL}/stats/by-region`);
  return handleResponse<{ success: boolean; data: BrandData[] }>(response);
}

export async function fetchScoreDistribution(): Promise<{ success: boolean; data: ScoreDistribution[] }> {
  const response = await fetch(`${BASE_URL}/stats/scores`);
  return handleResponse<{ success: boolean; data: ScoreDistribution[] }>(response);
}

export async function fetchTonnageTrends(period: string = '12m'): Promise<{ success: boolean; data: TonnageData[] }> {
  const response = await fetch(`${BASE_URL}/stats/tonnage?period=${period}`);
  return handleResponse<{ success: boolean; data: TonnageData[] }>(response);
}
