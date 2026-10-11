export type MatchStatus =
  | 'PERFECT_MATCH'
  | 'PRICE_DISCREPANCY'
  | 'QUANTITY_MISMATCH'
  | 'UNMATCHED_VENDOR'
  | 'UNDER_REVIEW';

export type DiscrepancySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LineItem {
  item_code: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface MatchDiscrepancy {
  discrepancy_type: string;
  severity: DiscrepancySeverity;
  field: string;
  invoice_value: string;
  po_value: string;
  variance_amount: number;
  notes: string;
}

export interface ThreeWayMatchResult {
  match_id: string;
  invoice_id: string;
  po_id?: string | null;
  gr_id?: string | null;
  status: MatchStatus;
  vendor_name: string;
  vendor_tax_id: string;
  total_invoice_amount: number;
  total_po_amount: number;
  net_variance: number;
  confidence_score: number;
  discrepancies: MatchDiscrepancy[];
  reconciliation_decision: string;
  reconciliation_reasoning: string;
  invoice_items: LineItem[];
  po_items: LineItem[];
  created_at: string;
}

export interface AuditStats {
  total_invoices: number;
  matched_invoices: number;
  discrepancy_count: number;
  total_spend_processed: number;
  total_variance_flagged: number;
  match_accuracy_pct: number;
}

export interface ReconcileRequest {
  invoice_text: string;
  vendor_name?: string;
  po_number?: string;
  tolerance_pct?: number;
  model?: string;
}
