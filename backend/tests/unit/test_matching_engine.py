from __future__ import annotations

import pytest
from src.ledgerline.domain.entities import (
    DiscrepancySeverity,
    DocumentType,
    FinancialDocument,
    LineItem,
    MatchStatus,
)
from src.ledgerline.services.extractor_engine import parse_financial_document_text
from src.ledgerline.services.matching_engine import perform_three_way_match


@pytest.fixture
def base_po() -> FinancialDocument:
    return FinancialDocument(
        id="po-test-1",
        doc_type=DocumentType.PURCHASE_ORDER,
        vendor_name="Acme Corp",
        vendor_tax_id="US-12345",
        doc_number="PO-100",
        date="2026-10-01",
        line_items=[
            LineItem(
                item_code="ITEM-A",
                description="Widget A",
                quantity=10.0,
                unit_price=50.0,
                total_price=500.0,
            )
        ],
        subtotal=500.0,
        tax=40.0,
        total_amount=540.0,
    )


def test_perfect_three_way_match(base_po: FinancialDocument) -> None:
    invoice = FinancialDocument(
        id="inv-test-1",
        doc_type=DocumentType.INVOICE,
        vendor_name="Acme Corp",
        vendor_tax_id="US-12345",
        doc_number="INV-100",
        date="2026-10-05",
        line_items=[
            LineItem(
                item_code="ITEM-A",
                description="Widget A",
                quantity=10.0,
                unit_price=50.0,
                total_price=500.0,
            )
        ],
        subtotal=500.0,
        tax=40.0,
        total_amount=540.0,
    )

    result = perform_three_way_match(invoice=invoice, po=base_po)
    assert result.status == MatchStatus.PERFECT_MATCH
    assert result.net_variance == 0.0
    assert len(result.discrepancies) == 0
    assert result.confidence_score >= 0.95
    assert result.reconciliation_decision == "APPROVE_FOR_PAYMENT"


def test_missing_po_rejection() -> None:
    invoice = FinancialDocument(
        id="inv-orphan",
        doc_type=DocumentType.INVOICE,
        vendor_name="Rogue Vendor",
        vendor_tax_id="US-99999",
        doc_number="INV-ORPHAN",
        date="2026-10-05",
        line_items=[],
        subtotal=1000.0,
        tax=0.0,
        total_amount=1000.0,
    )
    result = perform_three_way_match(invoice=invoice, po=None)
    assert result.status == MatchStatus.UNMATCHED_VENDOR
    assert result.reconciliation_decision == "REJECT_INVOICE"
    assert any(d.discrepancy_type == "MISSING_PURCHASE_ORDER" for d in result.discrepancies)


def test_vendor_tax_id_mismatch(base_po: FinancialDocument) -> None:
    invoice = base_po.model_copy(deep=True)
    invoice.vendor_tax_id = "US-FRAUD-999"
    invoice.doc_type = DocumentType.INVOICE

    result = perform_three_way_match(invoice=invoice, po=base_po)
    assert result.status == MatchStatus.UNMATCHED_VENDOR
    assert result.reconciliation_decision == "FLAG_FOR_FRAUD_REVIEW"
    assert any(d.discrepancy_type == "VENDOR_TAX_ID_MISMATCH" for d in result.discrepancies)


def test_price_discrepancy_detection(base_po: FinancialDocument) -> None:
    invoice = base_po.model_copy(deep=True)
    invoice.doc_type = DocumentType.INVOICE
    # Inflate unit price from $50 to $65
    invoice.line_items[0].unit_price = 65.0
    invoice.line_items[0].total_price = 650.0
    invoice.subtotal = 650.0
    invoice.total_amount = 690.0

    result = perform_three_way_match(invoice=invoice, po=base_po, tolerance_pct=0.02)
    assert result.status == MatchStatus.PRICE_DISCREPANCY
    assert result.reconciliation_decision == "FLAG_FOR_VENDOR_CREDIT"
    assert result.net_variance == 150.0
    price_disc = next(d for d in result.discrepancies if d.discrepancy_type == "UNIT_PRICE_VARIANCE")
    assert price_disc.variance_amount == 150.0


def test_goods_receipt_shortage_detection(base_po: FinancialDocument) -> None:
    invoice = base_po.model_copy(deep=True)
    invoice.doc_type = DocumentType.INVOICE

    # Goods receipt recorded only 6 items delivered instead of 10
    gr = FinancialDocument(
        id="gr-test-1",
        doc_type=DocumentType.GOODS_RECEIPT,
        vendor_name="Acme Corp",
        vendor_tax_id="US-12345",
        doc_number="GR-100",
        date="2026-10-06",
        line_items=[
            LineItem(
                item_code="ITEM-A",
                description="Widget A",
                quantity=6.0,
                unit_price=50.0,
                total_price=300.0,
            )
        ],
        subtotal=300.0,
        tax=0.0,
        total_amount=300.0,
    )

    result = perform_three_way_match(invoice=invoice, po=base_po, gr=gr)
    assert result.status == MatchStatus.QUANTITY_MISMATCH
    assert result.reconciliation_decision == "HOLD_FOR_RECEIVING"
    assert any(d.discrepancy_type == "UNFULFILLED_RECEIPT_SHORTAGE" for d in result.discrepancies)


def test_parse_financial_document_text() -> None:
    sample_text = """
    VENDOR: Apex Logistics Global
    TAX ID: US-EIN-88-7766554
    INVOICE #: INV-2026-991
    DATE: 2026-10-11

    ITEMS:
    SRV-101 Cloud Server Hosting 5 @ 120.00 = 600.00
    NET-202 Dedicated Bandwidth 2 @ 50.00 = 100.00

    TAX: 56.00
    TOTAL: 756.00
    """
    doc = parse_financial_document_text(sample_text)
    assert doc.vendor_name == "Apex Logistics Global"
    assert doc.vendor_tax_id == "US-EIN-88-7766554"
    assert doc.doc_number == "INV-2026-991"
    assert len(doc.line_items) == 2
    assert doc.line_items[0].item_code == "SRV-101"
    assert doc.line_items[0].quantity == 5.0
    assert doc.subtotal == 700.00
    assert doc.tax == 56.00
    assert doc.total_amount == 756.00
