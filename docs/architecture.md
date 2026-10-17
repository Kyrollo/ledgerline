# LedgerLine System Architecture & Financial Intelligence Design

LedgerLine is an enterprise **Accounts-Payable Document Intelligence and 3-Way Matching Engine**. It extracts structured line items from raw OCR invoices, executes deterministic 3-way reconciliation against Purchase Orders and warehouse Goods Receipts, and prompts an on-premise local GPU LLM to synthesize corporate controller audit directives.

---

## 1. C4 Container Diagram

```mermaid
flowchart TD
    subgraph Clients["Accounting & Financial Operations"]
        APSpecialist["Accounts Payable Specialist"]
        ERPSystem["ERP / SAP / NetSuite Connector"]
    end

    subgraph LedgerLinePlatform["LedgerLine AP Intelligence Platform"]
        UI["LedgerLine Web Console (React 18 + TailwindCSS)\nMatching Queue, Side-by-Side Line Items & Reconciler Lab"]
        APIGW["FastAPI REST Gateway\nAsync FastAPI (Python 3.12)"]
        
        subgraph CoreEngines["Core Financial Intelligence Engines"]
            DocExtractor["Financial Document & Table Extractor\nRegex & Table Parser + Checksum Validator"]
            MatchEngine["Algorithmic 3-Way Matching Engine\nPO Authorization, GR Shortage & Tolerance Analysis"]
            Reconciler["CFO Audit Reconciler\nLocal GPU LLM Integration Engine"]
            Store["Rolling AP Audit Store\nPre-seeded Reference Enterprise Invoices"]
        end
    end

    subgraph LocalHardware["Workstation GPU Inference Layer"]
        OllamaLocal["Local Ollama Engine\nDedicated NVIDIA GPU (16GB VRAM) / qwen2.5:0.5b"]
    end

    APSpecialist -->|Reviews Matches & Overrides| UI
    ERPSystem -->|Sends Invoices & POs| APIGW
    UI -->|REST Queries /api/v1| APIGW
    APIGW --> DocExtractor
    APIGW --> MatchEngine
    APIGW --> Reconciler
    MatchEngine --> Store
    Reconciler --> Store
    Reconciler -->|Synthesizes CFO Directives| OllamaLocal
```

---

## 2. 3-Way Match & Reconciliation Sequence

```mermaid
sequenceDiagram
    autonumber
    actor AP as AP Specialist / ERP
    participant UI as LedgerLine UI
    participant API as FastAPI Gateway
    participant Extractor as Document Extractor
    participant Engine as 3-Way Match Engine
    participant GPU as Local Dedicated NVIDIA GPU (Ollama)
    participant Store as AP Audit Store

    AP->>UI: Submit Invoice Text / Multimodal OCR
    UI->>API: POST /api/v1/reconcile {invoice_text, po_number}
    API->>Extractor: Parse Tables & Verify Checksums (subtotal + tax = total)
    Extractor-->>API: Structured FinancialDocument
    API->>Store: Fetch Corresponding PO (PO-2026-8801) & Goods Receipt
    Store-->>API: PO & GR Entities
    API->>Engine: Run 3-Way Match (Unit Price, Qty, Tax ID)
    Engine-->>API: MatchResult with Flagged Discrepancies
    API->>GPU: Send Audit Prompt to local Ollama (qwen2.5:0.5b)
    activate GPU
    GPU-->>API: Return Executive CFO Audit Memorandum
    deactivate GPU
    API->>Store: Persist Reconciled Match Record
    API-->>UI: 200 OK (ThreeWayMatchResult)
    UI-->>AP: Display Side-by-Side Comparison & Audit Decision
```

---

## 3. Core Architectural Modules

### A. Document Table Extractor (`extractor_engine.py`)
- Transforms unstructured OCR text into typed `FinancialDocument` instances.
- Verifies mathematical integrity: ensures `subtotal + tax == total_amount` with floating-point tolerance.
- Extracts vendor names, Tax ID / EIN, document numbers, and individual line items with unit prices and quantities.

### B. Algorithmic 3-Way Matching Engine (`matching_engine.py`)
- Strict verification of Vendor Master Data: flags Tax ID / EIN mismatches as potential fraudulent payment diversion.
- Compares invoice line items against purchase orders: identifies unauthorized line items and calculates dollar variances for unit prices exceeding tolerance thresholds (e.g., 2%).
- Reconciles against warehouse Goods Receipts (GR): identifies physical delivery shortages and flags unfulfilled goods.

### C. Executive CFO Reconciler (`reconciler_engine.py`)
- Employs local GPU LLM (`qwen2.5:0.5b` on NVIDIA Dedicated NVIDIA GPU) to synthesize concise, CFO-grade audit memoranda.
- Generates definitive accounting directives: `APPROVE_FOR_PAYMENT`, `FLAG_FOR_VENDOR_CREDIT`, `HOLD_FOR_RECEIVING`, `FLAG_FOR_FRAUD_REVIEW`.
- Ensures zero financial data leakage by running exclusively on on-premise hardware.
