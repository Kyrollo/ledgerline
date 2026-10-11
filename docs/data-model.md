# LedgerLine Data Model & Financial Entity Schema

The LedgerLine data model defines the structural foundation for accounts payable matching, line-item reconciliation, and audit discrepancy logging.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    FINANCIAL_DOCUMENT ||--|{ LINE_ITEM : "contains"
    THREE_WAY_MATCH ||--|{ MATCH_DISCREPANCY : "flags"
    THREE_WAY_MATCH ||--|| FINANCIAL_DOCUMENT : "evaluates invoice"
    THREE_WAY_MATCH ||--o| FINANCIAL_DOCUMENT : "reconciles PO"
    AUDIT_STATS ||--o{ THREE_WAY_MATCH : "aggregates"

    FINANCIAL_DOCUMENT {
        string id PK "Unique Document Identifier"
        enum doc_type "INVOICE | PURCHASE_ORDER | GOODS_RECEIPT"
        string vendor_name "Legal supplier name"
        string vendor_tax_id "Tax ID / EIN / VAT"
        string doc_number "Invoice or PO number"
        string date "Document date"
        string currency "USD / EUR"
        float subtotal "Sum of line items"
        float tax "Sales / VAT tax"
        float total_amount "Checksum total"
        float ocr_confidence "Extraction confidence"
        string raw_text "Raw document text"
    }

    LINE_ITEM {
        string item_code "Product or service SKU"
        string description "Item description"
        float quantity "Billed or ordered quantity"
        float unit_price "Price per unit"
        float total_price "Line item total amount"
    }

    THREE_WAY_MATCH {
        string match_id PK "Unique Reconciliation ID"
        string invoice_id FK "Reference to invoice"
        string po_id FK "Reference to purchase order"
        string gr_id FK "Reference to goods receipt"
        enum status "PERFECT_MATCH | PRICE_DISCREPANCY | QUANTITY_MISMATCH | UNMATCHED_VENDOR | UNDER_REVIEW"
        string vendor_name "Supplier name"
        string vendor_tax_id "Remittance tax ID"
        float total_invoice_amount "Billed total"
        float total_po_amount "PO authorized total"
        float net_variance "Net dollar difference"
        float confidence_score "Algorithmic match confidence"
        string reconciliation_decision "CFO accounting directive"
        string reconciliation_reasoning "Executive memorandum"
        string created_at "ISO 8601 timestamp"
    }

    MATCH_DISCREPANCY {
        string discrepancy_type "UNIT_PRICE_VARIANCE | QUANTITY_OVERBILLING | UNFULFILLED_RECEIPT_SHORTAGE | VENDOR_TAX_ID_MISMATCH"
        enum severity "LOW | MEDIUM | HIGH | CRITICAL"
        string field "Target document attribute"
        string invoice_value "Billed value"
        string po_value "Authorized value"
        float variance_amount "Dollar variance"
        string notes "Internal control observation"
    }

    AUDIT_STATS {
        int total_invoices "Total invoices ingested"
        int matched_invoices "Zero-variance matches"
        int discrepancy_count "Total discrepancies flagged"
        float total_spend_processed "Cumulative spend"
        float total_variance_flagged "Cumulative variance protected"
        float match_accuracy_pct "Automated match percentage"
    }
```

---

## 2. Discrepancy Types & Severity Matrix

| Discrepancy Type | Severity | Description | Recommended AP Action |
| :--- | :--- | :--- | :--- |
| `VENDOR_TAX_ID_MISMATCH` | **CRITICAL** | Invoice EIN differs from Master Vendor Record | Immediate payment freeze; verify supplier banking coordinates |
| `UNFULFILLED_RECEIPT_SHORTAGE` | **CRITICAL** | Billed quantity exceeds warehouse physical receipt | Hold payment for receiving ticket confirmation or credit note |
| `UNIT_PRICE_VARIANCE` | **HIGH** | Unit price exceeds contract PO by > tolerance % | Issue short-payment and request supplier credit memo |
| `UNAUTHORIZED_LINE_ITEM` | **HIGH** | Fee or line item missing from approved PO | Reject line item and request revised invoice |
| `QUANTITY_OVERBILLING` | **HIGH** | Billed quantity exceeds PO authorized quantity | Reconcile with procurement purchaser before approval |
