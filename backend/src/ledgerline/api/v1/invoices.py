from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from src.ledgerline.domain.entities import (
    AuditStats,
    ReconcileRequest,
    ThreeWayMatchResult,
)
from src.ledgerline.services.reconciler_engine import (
    UpstreamOllamaError,
    reconcile_and_audit_invoice,
)
from src.ledgerline.services.store import store

router = APIRouter(tags=["invoices"])


@router.get("/matches", response_model=list[ThreeWayMatchResult])
async def list_matches() -> list[ThreeWayMatchResult]:
    """Retrieve all accounts payable 3-way matching and discrepancy audit records."""
    return list(store.matches.values())


@router.get("/matches/{match_id}", response_model=ThreeWayMatchResult)
async def get_match(match_id: str) -> ThreeWayMatchResult:
    """Retrieve detailed 3-way match comparison breakdown and line items."""
    match = store.matches.get(match_id)
    if not match:
        raise HTTPException(status_code=404, detail=f"Match record {match_id} not found")
    return match


@router.get("/stats", response_model=AuditStats)
async def get_stats() -> AuditStats:
    """Retrieve accounts payable KPIs: processed spend, variance flagged, accuracy rate."""
    return store.get_stats()


@router.post("/reconcile", response_model=ThreeWayMatchResult)
async def run_live_reconcile(req: ReconcileRequest) -> ThreeWayMatchResult:
    """
    Parses raw invoice text, executes algorithmic 3-way match against PO,
    and prompts local GPU Ollama on NVIDIA Dedicated NVIDIA GPU to synthesize an executive CFO audit memorandum.
    """
    if not req.invoice_text.strip():
        raise HTTPException(status_code=400, detail="Invoice document text cannot be empty")

    try:
        result = await reconcile_and_audit_invoice(
            req, po_store_lookup=store.purchase_orders
        )
        store.matches[result.match_id] = result
        return result
    except UpstreamOllamaError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "type": "https://ledgerline.ai/errors/upstream-unavailable",
                "title": "Local GPU LLM Engine Unavailable",
                "status": 503,
                "detail": str(exc),
            },
        )
