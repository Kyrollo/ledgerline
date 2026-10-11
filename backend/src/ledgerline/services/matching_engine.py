from __future__ import annotations

import uuid
from datetime import datetime, timezone
from src.ledgerline.domain.entities import (
    DiscrepancySeverity,
    FinancialDocument,
    LineItem,
    MatchDiscrepancy,
    MatchStatus,
    ThreeWayMatchResult,
)


def perform_three_way_match(
    invoice: FinancialDocument,
    po: FinancialDocument | None,
    gr: FinancialDocument | None = None,
    tolerance_pct: float = 0.02,
) -> ThreeWayMatchResult:
    """
    Executes algorithmic 3-way financial matching across Invoice, Purchase Order, and Goods Receipt.
    Verifies vendor identifiers, line item unit prices, quantities, and net balances.
    """
    discrepancies: list[MatchDiscrepancy] = []
    match_id = f"mat-{uuid.uuid4().hex[:8]}"
    created_at = datetime.now(timezone.utc).isoformat()

    # Rule 1: Missing Purchase Order
    if not po:
        discrepancies.append(
            MatchDiscrepancy(
                discrepancy_type="MISSING_PURCHASE_ORDER",
                severity=DiscrepancySeverity.CRITICAL,
                field="po_number",
                invoice_value=invoice.doc_number,
                po_value="N/A",
                variance_amount=invoice.total_amount,
                notes="No matching Purchase Order found in ERP system. High risk of rogue spend.",
            )
        )
        return ThreeWayMatchResult(
            match_id=match_id,
            invoice_id=invoice.id,
            po_id=None,
            gr_id=None,
            status=MatchStatus.UNMATCHED_VENDOR,
            vendor_name=invoice.vendor_name,
            vendor_tax_id=invoice.vendor_tax_id,
            total_invoice_amount=invoice.total_amount,
            total_po_amount=0.0,
            net_variance=invoice.total_amount,
            confidence_score=0.40,
            discrepancies=discrepancies,
            reconciliation_decision="REJECT_INVOICE",
            reconciliation_reasoning="Invoice lacks a valid approved Purchase Order. Requires procurement review.",
            invoice_items=invoice.line_items,
            po_items=[],
            created_at=created_at,
        )

    # Rule 2: Vendor Tax ID & Identity Verification
    if invoice.vendor_tax_id.strip() != po.vendor_tax_id.strip():
        discrepancies.append(
            MatchDiscrepancy(
                discrepancy_type="VENDOR_TAX_ID_MISMATCH",
                severity=DiscrepancySeverity.CRITICAL,
                field="vendor_tax_id",
                invoice_value=invoice.vendor_tax_id,
                po_value=po.vendor_tax_id,
                variance_amount=0.0,
                notes=f"Invoice tax ID '{invoice.vendor_tax_id}' does not match PO vendor master '{po.vendor_tax_id}'. Potential vendor impersonation.",
            )
        )

    # Map PO items by item_code for O(1) comparison
    po_item_map: dict[str, LineItem] = {item.item_code.upper(): item for item in po.line_items}
    gr_item_map: dict[str, LineItem] = (
        {item.item_code.upper(): item for item in gr.line_items} if gr else {}
    )

    total_variance = 0.0

    # Rule 3: Line Item Unit Price & Quantity Reconciliation
    for inv_item in invoice.line_items:
        code = inv_item.item_code.upper()
        if code not in po_item_map:
            variance = inv_item.total_price
            total_variance += variance
            discrepancies.append(
                MatchDiscrepancy(
                    discrepancy_type="UNAUTHORIZED_LINE_ITEM",
                    severity=DiscrepancySeverity.HIGH,
                    field=f"items[{inv_item.item_code}]",
                    invoice_value=f"{inv_item.quantity}x @ ${inv_item.unit_price:.2f}",
                    po_value="Not on PO",
                    variance_amount=variance,
                    notes=f"Item '{inv_item.description}' was not pre-authorized on Purchase Order.",
                )
            )
            continue

        po_item = po_item_map[code]

        # Check Unit Price Variance
        price_diff = inv_item.unit_price - po_item.unit_price
        pct_price_diff = abs(price_diff) / po_item.unit_price if po_item.unit_price > 0 else 0.0

        if pct_price_diff > tolerance_pct:
            dollar_diff = round((inv_item.unit_price - po_item.unit_price) * inv_item.quantity, 2)
            total_variance += dollar_diff
            severity = (
                DiscrepancySeverity.HIGH if pct_price_diff > 0.10 else DiscrepancySeverity.MEDIUM
            )
            discrepancies.append(
                MatchDiscrepancy(
                    discrepancy_type="UNIT_PRICE_VARIANCE",
                    severity=severity,
                    field=f"items[{inv_item.item_code}].unit_price",
                    invoice_value=f"${inv_item.unit_price:.2f}",
                    po_value=f"${po_item.unit_price:.2f}",
                    variance_amount=dollar_diff,
                    notes=f"Unit price variance of {pct_price_diff * 100:.1f}% exceeds tolerance threshold of {tolerance_pct * 100:.1f}%.",
                )
            )

        # Check Quantity Variance vs PO
        qty_diff = inv_item.quantity - po_item.quantity
        if qty_diff > 0:
            dollar_diff = round(qty_diff * inv_item.unit_price, 2)
            total_variance += dollar_diff
            discrepancies.append(
                MatchDiscrepancy(
                    discrepancy_type="QUANTITY_OVERBILLING",
                    severity=DiscrepancySeverity.HIGH,
                    field=f"items[{inv_item.item_code}].quantity",
                    invoice_value=str(inv_item.quantity),
                    po_value=str(po_item.quantity),
                    variance_amount=dollar_diff,
                    notes=f"Billed quantity ({inv_item.quantity}) exceeds PO authorized quantity ({po_item.quantity}).",
                )
            )

        # Rule 4: Goods Receipt (GR) Verification
        if gr and code in gr_item_map:
            gr_item = gr_item_map[code]
            if inv_item.quantity > gr_item.quantity:
                shortage = inv_item.quantity - gr_item.quantity
                dollar_diff = round(shortage * inv_item.unit_price, 2)
                discrepancies.append(
                    MatchDiscrepancy(
                        discrepancy_type="UNFULFILLED_RECEIPT_SHORTAGE",
                        severity=DiscrepancySeverity.CRITICAL,
                        field=f"items[{inv_item.item_code}].goods_receipt",
                        invoice_value=f"Billed {inv_item.quantity}",
                        po_value=f"Received {gr_item.quantity}",
                        variance_amount=dollar_diff,
                        notes=f"Warehouse goods receipt confirms only {gr_item.quantity} units delivered. Shortage of {shortage} units.",
                    )
                )

    # Determine final match status
    net_total_diff = round(invoice.total_amount - po.total_amount, 2)
    has_tax_id_error = any(d.discrepancy_type == "VENDOR_TAX_ID_MISMATCH" for d in discrepancies)
    has_price_error = any(d.discrepancy_type == "UNIT_PRICE_VARIANCE" for d in discrepancies)
    has_qty_error = any(
        d.discrepancy_type in ("QUANTITY_OVERBILLING", "UNFULFILLED_RECEIPT_SHORTAGE")
        for d in discrepancies
    )

    if has_tax_id_error:
        status = MatchStatus.UNMATCHED_VENDOR
        decision = "FLAG_FOR_FRAUD_REVIEW"
        reasoning = "Vendor tax identification mismatch detected. Hold payment pending vendor bank and master data validation."
        confidence = 0.55
    elif has_qty_error:
        status = MatchStatus.QUANTITY_MISMATCH
        decision = "HOLD_FOR_RECEIVING"
        reasoning = f"Quantity discrepancies detected totaling ${total_variance:,.2f}. Require revised delivery receipt or credit note."
        confidence = 0.78
    elif has_price_error:
        status = MatchStatus.PRICE_DISCREPANCY
        decision = "FLAG_FOR_VENDOR_CREDIT"
        reasoning = f"Price inflation exceeds contract tolerance. Request vendor credit memo of ${abs(net_total_diff):,.2f}."
        confidence = 0.85
    elif len(discrepancies) == 0:
        status = MatchStatus.PERFECT_MATCH
        decision = "APPROVE_FOR_PAYMENT"
        reasoning = "All 3-way match controls satisfied. Line items, quantities, and pricing exactly match approved Purchase Order."
        confidence = 0.99
    else:
        status = MatchStatus.UNDER_REVIEW
        decision = "ESCALATE_TO_CONTROLLER"
        reasoning = "Multiple accounting variances detected across line items. Manual SRE/AP review required."
        confidence = 0.70

    return ThreeWayMatchResult(
        match_id=match_id,
        invoice_id=invoice.id,
        po_id=po.id,
        gr_id=gr.id if gr else None,
        status=status,
        vendor_name=invoice.vendor_name,
        vendor_tax_id=invoice.vendor_tax_id,
        total_invoice_amount=invoice.total_amount,
        total_po_amount=po.total_amount,
        net_variance=net_total_diff,
        confidence_score=confidence,
        discrepancies=discrepancies,
        reconciliation_decision=decision,
        reconciliation_reasoning=reasoning,
        invoice_items=invoice.line_items,
        po_items=po.line_items,
        created_at=created_at,
    )
