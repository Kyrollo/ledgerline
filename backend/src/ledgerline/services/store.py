from __future__ import annotations

from typing import Dict
from src.ledgerline.domain.entities import (
    AuditStats,
    DiscrepancySeverity,
    DocumentType,
    FinancialDocument,
    LineItem,
    MatchDiscrepancy,
    MatchStatus,
    ThreeWayMatchResult,
)


class LedgerLineStore:
    """Thread-safe persistent state store for Accounts Payable 3-way matching records."""

    def __init__(self) -> None:
        self.matches: Dict[str, ThreeWayMatchResult] = {}
        self.purchase_orders: Dict[str, FinancialDocument] = {}
        self._seed_reference_records()

    def _seed_reference_records(self) -> None:
        # Pre-seed standard PO for interactive live reconciliation lab
        standard_po = FinancialDocument(
            id="po-master-8801",
            doc_type=DocumentType.PURCHASE_ORDER,
            vendor_name="Acme Global Solutions",
            vendor_tax_id="US-EIN-12-3456789",
            doc_number="PO-2026-8801",
            date="2026-10-01",
            currency="USD",
            line_items=[
                LineItem(
                    item_code="SRV-CLOUD-01",
                    description="Enterprise Cloud Host Instance",
                    quantity=10.0,
                    unit_price=150.00,
                    total_price=1500.00,
                ),
                LineItem(
                    item_code="LIC-SRE-PRO",
                    description="SRE Copilot Seat License",
                    quantity=5.0,
                    unit_price=80.00,
                    total_price=400.00,
                ),
            ],
            subtotal=1900.00,
            tax=156.75,
            total_amount=2056.75,
            raw_text="PO-2026-8801 Acme Global Solutions Standard Service Agreement",
        )
        self.purchase_orders["PO-2026-8801"] = standard_po

        # --- Match 1: Perfect Match (Cloud Hosting) ---
        m1 = ThreeWayMatchResult(
            match_id="mat-101",
            invoice_id="inv-acme-9901",
            po_id="po-master-8801",
            gr_id="gr-cloud-4401",
            status=MatchStatus.PERFECT_MATCH,
            vendor_name="Acme Global Solutions",
            vendor_tax_id="US-EIN-12-3456789",
            total_invoice_amount=2056.75,
            total_po_amount=2056.75,
            net_variance=0.00,
            confidence_score=0.99,
            discrepancies=[],
            reconciliation_decision="APPROVE_FOR_PAYMENT",
            reconciliation_reasoning="Full 3-way algorithmic match achieved. PO-2026-8801 line items, rates, and verified services match invoice without variance. Authorized for payment run.",
            invoice_items=standard_po.line_items,
            po_items=standard_po.line_items,
            created_at="2026-10-11T09:15:00Z",
        )

        # --- Match 2: Price Discrepancy (Logistics) ---
        m2_invoice_items = [
            LineItem(
                item_code="FRT-PALLET-01",
                description="Cross-Country Freight Pallet Transport",
                quantity=4.0,
                unit_price=950.00,  # PO had 850.00
                total_price=3800.00,
            ),
            LineItem(
                item_code="FUEL-SURCHARGE",
                description="Uncontracted Fuel Index Fee",
                quantity=1.0,
                unit_price=400.00,
                total_price=400.00,
            ),
        ]
        m2_po_items = [
            LineItem(
                item_code="FRT-PALLET-01",
                description="Cross-Country Freight Pallet Transport",
                quantity=4.0,
                unit_price=850.00,
                total_price=3400.00,
            )
        ]
        m2 = ThreeWayMatchResult(
            match_id="mat-102",
            invoice_id="inv-logistics-7721",
            po_id="po-freight-3310",
            gr_id="gr-freight-2201",
            status=MatchStatus.PRICE_DISCREPANCY,
            vendor_name="Global Freight & Logistics LLC",
            vendor_tax_id="US-EIN-98-7654321",
            total_invoice_amount=4545.00,
            total_po_amount=3680.50,
            net_variance=864.50,
            confidence_score=0.84,
            discrepancies=[
                MatchDiscrepancy(
                    discrepancy_type="UNIT_PRICE_VARIANCE",
                    severity=DiscrepancySeverity.HIGH,
                    field="items[FRT-PALLET-01].unit_price",
                    invoice_value="$950.00",
                    po_value="$850.00",
                    variance_amount=400.00,
                    notes="Contract rate of $850/pallet inflated to $950/pallet (+11.8% variance).",
                ),
                MatchDiscrepancy(
                    discrepancy_type="UNAUTHORIZED_LINE_ITEM",
                    severity=DiscrepancySeverity.HIGH,
                    field="items[FUEL-SURCHARGE]",
                    invoice_value="1x @ $400.00",
                    po_value="Not on PO",
                    variance_amount=400.00,
                    notes="Fuel surcharge line item not authorized in Master Service Agreement.",
                ),
            ],
            reconciliation_decision="FLAG_FOR_VENDOR_CREDIT",
            reconciliation_reasoning="Invoice exceeds authorized purchase agreement by $864.50 due to rate inflation and unauthorized fuel surcharges. Recommend issuing short payment and requesting credit memo.",
            invoice_items=m2_invoice_items,
            po_items=m2_po_items,
            created_at="2026-10-11T10:30:00Z",
        )

        # --- Match 3: Quantity Mismatch (Hardware Servers) ---
        m3_invoice_items = [
            LineItem(
                item_code="SRV-RACK-2U",
                description="Enterprise GPU Server 2U Rackmount",
                quantity=20.0,
                unit_price=2500.00,
                total_price=50000.00,
            )
        ]
        m3_po_items = [
            LineItem(
                item_code="SRV-RACK-2U",
                description="Enterprise GPU Server 2U Rackmount",
                quantity=20.0,
                unit_price=2500.00,
                total_price=50000.00,
            )
        ]
        m3 = ThreeWayMatchResult(
            match_id="mat-103",
            invoice_id="inv-quantum-5501",
            po_id="po-servers-1100",
            gr_id="gr-warehouse-0044",
            status=MatchStatus.QUANTITY_MISMATCH,
            vendor_name="Quantum Server Hardware Inc",
            vendor_tax_id="US-EIN-54-3210987",
            total_invoice_amount=54125.00,
            total_po_amount=54125.00,
            net_variance=0.00,
            confidence_score=0.76,
            discrepancies=[
                MatchDiscrepancy(
                    discrepancy_type="UNFULFILLED_RECEIPT_SHORTAGE",
                    severity=DiscrepancySeverity.CRITICAL,
                    field="items[SRV-RACK-2U].goods_receipt",
                    invoice_value="Billed 20.0 units",
                    po_value="Received 15.0 units",
                    variance_amount=12500.00,
                    notes="Warehouse dock receiving ticket GR-0044 recorded only 15 units delivered. 5 units backordered.",
                )
            ],
            reconciliation_decision="HOLD_FOR_RECEIVING",
            reconciliation_reasoning="Warehouse receiving dock confirms only 15 of 20 servers received. Hold payment of $12,500 until warehouse confirms final delivery of remaining 5 units.",
            invoice_items=m3_invoice_items,
            po_items=m3_po_items,
            created_at="2026-10-11T11:00:00Z",
        )

        # --- Match 4: Vendor Tax ID Mismatch (Fraud Alert) ---
        m4_invoice_items = [
            LineItem(
                item_code="OFF-PAPER-A4",
                description="Standard Copy Paper 500ct Reams",
                quantity=50.0,
                unit_price=12.00,
                total_price=600.00,
            )
        ]
        m4_po_items = [
            LineItem(
                item_code="OFF-PAPER-A4",
                description="Standard Copy Paper 500ct Reams",
                quantity=50.0,
                unit_price=12.00,
                total_price=600.00,
            )
        ]
        m4 = ThreeWayMatchResult(
            match_id="mat-104",
            invoice_id="inv-apex-3301",
            po_id="po-supplies-8820",
            gr_id="gr-supplies-1100",
            status=MatchStatus.UNMATCHED_VENDOR,
            vendor_name="Apex Office Supplies Co",
            vendor_tax_id="US-EIN-99-9999999",  # Fraudulent tax ID
            total_invoice_amount=649.50,
            total_po_amount=649.50,
            net_variance=0.00,
            confidence_score=0.52,
            discrepancies=[
                MatchDiscrepancy(
                    discrepancy_type="VENDOR_TAX_ID_MISMATCH",
                    severity=DiscrepancySeverity.CRITICAL,
                    field="vendor_tax_id",
                    invoice_value="US-EIN-99-9999999",
                    po_value="US-EIN-11-2233445",
                    variance_amount=0.00,
                    notes="Invoice remittance tax ID does not match Master Vendor File. Risk of redirected payment intercept.",
                )
            ],
            reconciliation_decision="FLAG_FOR_FRAUD_REVIEW",
            reconciliation_reasoning="CRITICAL SECURITY ALERT: Remittance Tax ID fails vendor validation. Freeze payment immediately and verify banking coordinates with vendor chief financial officer.",
            invoice_items=m4_invoice_items,
            po_items=m4_po_items,
            created_at="2026-10-11T11:45:00Z",
        )

        self.matches[m1.match_id] = m1
        self.matches[m2.match_id] = m2
        self.matches[m3.match_id] = m3
        self.matches[m4.match_id] = m4

    def get_stats(self) -> AuditStats:
        """Aggregates accounts payable KPIs."""
        records = list(self.matches.values())
        if not records:
            return AuditStats(
                total_invoices=0,
                matched_invoices=0,
                discrepancy_count=0,
                total_spend_processed=0.0,
                total_variance_flagged=0.0,
                match_accuracy_pct=0.0,
            )

        total_invoices = len(records)
        matched_invoices = sum(1 for m in records if m.status == MatchStatus.PERFECT_MATCH)
        total_discrepancies = sum(len(m.discrepancies) for m in records)
        total_spend = round(sum(m.total_invoice_amount for m in records), 2)
        total_variance = round(
            sum(sum(d.variance_amount for d in m.discrepancies) for m in records), 2
        )
        accuracy = round((matched_invoices / total_invoices) * 100.0, 1)

        return AuditStats(
            total_invoices=total_invoices,
            matched_invoices=matched_invoices,
            discrepancy_count=total_discrepancies,
            total_spend_processed=total_spend,
            total_variance_flagged=total_variance,
            match_accuracy_pct=accuracy,
        )


store = LedgerLineStore()
