import { AuditStats, ReconcileRequest, ThreeWayMatchResult } from '../types/ledgerline';

const BASE_URL = '/api/v1';

export async function fetchMatches(): Promise<ThreeWayMatchResult[]> {
  const res = await fetch(`${BASE_URL}/matches`);
  if (!res.ok) {
    throw new Error(`Failed to fetch 3-way match records: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMatch(id: string): Promise<ThreeWayMatchResult> {
  const res = await fetch(`${BASE_URL}/matches/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch match ${id}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchStats(): Promise<AuditStats> {
  const res = await fetch(`${BASE_URL}/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch audit stats: ${res.statusText}`);
  }
  return res.json();
}

export async function runReconcile(payload: ReconcileRequest): Promise<ThreeWayMatchResult> {
  const res = await fetch(`${BASE_URL}/reconcile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.detail?.detail || errorBody?.detail || res.statusText;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return res.json();
}
