from __future__ import annotations

from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    INVOICE = "INVOICE"
    PURCHASE_ORDER = "PURCHASE_ORDER"
    GOODS_RECEIPT = "GOODS_RECEIPT"


class MatchStatus(str, Enum):
    PERFECT_MATCH = "PERFECT_MATCH"
    PRICE_DISCREPANCY = "PRICE_DISCREPANCY"
    QUANTITY_MISMATCH = "QUANTITY_MISMATCH"
    UNMATCHED_VENDOR = "UNMATCHED_VENDOR"
    UNDER_REVIEW = "UNDER_REVIEW"


class DiscrepancySeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class LineItem(BaseModel):
    item_code: str
    description: str
    quantity: float
    unit_price: float
    total_price: float


class FinancialDocument(BaseModel):
    id: str
    doc_type: DocumentType
    vendor_name: str
    vendor_tax_id: str
    doc_number: str
    date: str
    currency: str = "USD"
    line_items: list[LineItem] = Field(default_factory=list)
    subtotal: float
    tax: float
    total_amount: float
    ocr_confidence: float = 0.98
    raw_text: str = ""


class MatchDiscrepancy(BaseModel):
    discrepancy_type: str
    severity: DiscrepancySeverity
    field: str
    invoice_value: str
    po_value: str
    variance_amount: float
    notes: str


class ThreeWayMatchResult(BaseModel):
    match_id: str
    invoice_id: str
    po_id: str | None = None
    gr_id: str | None = None
    status: MatchStatus
    vendor_name: str
    vendor_tax_id: str
    total_invoice_amount: float
    total_po_amount: float
    net_variance: float
    confidence_score: float
    discrepancies: list[MatchDiscrepancy] = Field(default_factory=list)
    reconciliation_decision: str
    reconciliation_reasoning: str
    invoice_items: list[LineItem] = Field(default_factory=list)
    po_items: list[LineItem] = Field(default_factory=list)
    created_at: str


class AuditStats(BaseModel):
    total_invoices: int
    matched_invoices: int
    discrepancy_count: int
    total_spend_processed: float
    total_variance_flagged: float
    match_accuracy_pct: float


class ReconcileRequest(BaseModel):
    invoice_text: str
    vendor_name: str = "Acme Global Solutions"
    po_number: str = "PO-2026-8801"
    tolerance_pct: float = 0.02
    model: str = "qwen2.5:0.5b"
