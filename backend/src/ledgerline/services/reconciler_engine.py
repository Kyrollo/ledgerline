from __future__ import annotations

import httpx
from src.ledgerline.core.config import settings
from src.ledgerline.domain.entities import (
    MatchStatus,
    ReconcileRequest,
    ThreeWayMatchResult,
)
from src.ledgerline.services.extractor_engine import parse_financial_document_text
from src.ledgerline.services.matching_engine import perform_three_way_match


class UpstreamOllamaError(Exception):
    """Raised when the local Ollama LLM endpoint is unreachable or fails."""


async def reconcile_and_audit_invoice(
    req: ReconcileRequest,
    po_store_lookup: dict[str, Any] | None = None,
) -> ThreeWayMatchResult:
    """
    Parses invoice text, executes 3-way matching algorithm, and prompts the local GPU
    Ollama instance to generate a CFO-level reconciliation audit memorandum.
    """
    # 1. Parse raw text into structured invoice
    invoice_doc = parse_financial_document_text(
        raw_text=req.invoice_text,
        vendor_override=req.vendor_name,
    )

    # 2. Look up matching Purchase Order or build matching PO baseline
    po_doc = None
    if po_store_lookup and req.po_number in po_store_lookup:
        po_doc = po_store_lookup[req.po_number]

    # 3. Perform algorithmic 3-way match
    match_result = perform_three_way_match(
        invoice=invoice_doc,
        po=po_doc,
        tolerance_pct=req.tolerance_pct,
    )

    # 4. Generate local GPU executive CFO reconciliation memo
    prompt = f"""You are the Corporate Controller and Chief Accounting Officer.
Analyze the following Accounts Payable 3-way matching outcome and issue an audit memorandum:

Vendor: {match_result.vendor_name}
Invoice Amount: ${match_result.total_invoice_amount:,.2f}
PO Amount: ${match_result.total_po_amount:,.2f}
Net Variance: ${match_result.net_variance:,.2f}
Match Status: {match_result.status.value}
Algorithmic Decision: {match_result.reconciliation_decision}
Discrepancies Detected ({len(match_result.discrepancies)}):
{chr(10).join(f"- {d.discrepancy_type} ({d.severity.value}): {d.notes} (Variance: ${d.variance_amount:,.2f})" for d in match_result.discrepancies)}

Provide a concise, professional 2-sentence executive reconciliation instruction specifying:
1. Exact financial resolution (Approve payment, Request credit memo, or Hold).
2. Internal control compliance directive for the accounting ledger."""

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                f"{settings.LLM_BASE_URL.rstrip('/v1')}/api/generate",
                json={
                    "model": req.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.2, "num_predict": 2048},
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                synthesis = data.get("response", "").strip()
                if synthesis:
                    match_result.reconciliation_reasoning = synthesis
            else:
                raise UpstreamOllamaError(
                    f"Ollama returned HTTP status {resp.status_code}: {resp.text}"
                )
    except Exception as exc:
        if not isinstance(exc, UpstreamOllamaError):
            raise UpstreamOllamaError(f"Failed to connect to local Ollama on RTX A5000: {exc}") from exc
        raise

    return match_result
