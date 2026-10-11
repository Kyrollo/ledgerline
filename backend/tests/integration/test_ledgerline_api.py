from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_matches(client: AsyncClient) -> None:
    response = await client.get("/api/v1/matches")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 4
    match_ids = [m["match_id"] for m in data]
    assert "mat-101" in match_ids
    assert "mat-102" in match_ids
    assert "mat-103" in match_ids
    assert "mat-104" in match_ids


@pytest.mark.asyncio
async def test_get_match_detail(client: AsyncClient) -> None:
    response = await client.get("/api/v1/matches/mat-101")
    assert response.status_code == 200
    data = response.json()
    assert data["match_id"] == "mat-101"
    assert data["status"] == "PERFECT_MATCH"
    assert data["net_variance"] == 0.0
    assert len(data["invoice_items"]) > 0


@pytest.mark.asyncio
async def test_get_match_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/v1/matches/non-existent-999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_stats(client: AsyncClient) -> None:
    response = await client.get("/api/v1/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_invoices"] >= 4
    assert data["total_spend_processed"] > 0
    assert "match_accuracy_pct" in data


@pytest.mark.asyncio
async def test_reconcile_empty_validation(client: AsyncClient) -> None:
    response = await client.post("/api/v1/reconcile", json={"invoice_text": "   "})
    assert response.status_code == 400
