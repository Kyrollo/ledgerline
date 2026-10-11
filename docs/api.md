# LedgerLine REST API Reference

LedgerLine exposes an asynchronous REST API under the `/api/v1` namespace for consuming 3-way matching records, accounts payable statistics, and executing real-time invoice reconciliation.

---

## Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/info` | Service metadata, architecture archetype, and version |
| `GET` | `/api/v1/healthz` | Kubernetes liveness probe |
| `GET` | `/api/v1/readyz` | Kubernetes readiness probe (validates local GPU LLM connectivity) |
| `GET` | `/api/v1/matches` | Returns all recorded 3-way matching and discrepancy records |
| `GET` | `/api/v1/matches/{match_id}` | Detailed 3-way match breakdown with line items and discrepancies |
| `GET` | `/api/v1/stats` | High-level AP KPIs: processed spend, flagged variance, accuracy |
| `POST` | `/api/v1/reconcile` | Executes live 3-way match and local GPU CFO memorandum synthesis |

---

## 1. List Matches
- **Endpoint**: `GET /api/v1/matches`
- **Response**: `200 OK`
```json
[
  {
    "match_id": "mat-101",
    "invoice_id": "inv-acme-9901",
    "po_id": "po-master-8801",
    "gr_id": "gr-cloud-4401",
    "status": "PERFECT_MATCH",
    "vendor_name": "Acme Global Solutions",
    "vendor_tax_id": "US-EIN-12-3456789",
    "total_invoice_amount": 2056.75,
    "total_po_amount": 2056.75,
    "net_variance": 0.0,
    "confidence_score": 0.99,
    "discrepancies": [],
    "reconciliation_decision": "APPROVE_FOR_PAYMENT",
    "reconciliation_reasoning": "Full 3-way algorithmic match achieved...",
    "created_at": "2026-10-11T09:15:00Z"
  }
]
```

---

## 2. Get Accounts Payable Statistics
- **Endpoint**: `GET /api/v1/stats`
- **Response**: `200 OK`
```json
{
  "total_invoices": 4,
  "matched_invoices": 1,
  "discrepancy_count": 4,
  "total_spend_processed": 61376.25,
  "total_variance_flagged": 14164.50,
  "match_accuracy_pct": 25.0
}
```

---

## 3. Run Live Reconciliation
- **Endpoint**: `POST /api/v1/reconcile`
- **Request Body**:
```json
{
  "invoice_text": "VENDOR: Acme Global Solutions\nTAX ID: US-EIN-12-3456789\nINVOICE #: INV-8891\nSRV-CLOUD-01 Cloud Instance 10 @ 150.00 = 1500.00\nTAX: 123.75\nTOTAL: 1623.75",
  "vendor_name": "Acme Global Solutions",
  "po_number": "PO-2026-8801",
  "tolerance_pct": 0.02,
  "model": "qwen2.5:0.5b"
}
```
- **Response**: `200 OK` (`ThreeWayMatchResult`)
