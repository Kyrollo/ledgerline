from __future__ import annotations

from fastapi import APIRouter
from .health import router as health_router
from .auth import router as auth_router
from .invoices import router as invoices_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(auth_router)
api_v1_router.include_router(invoices_router)


@api_v1_router.get("/info", tags=["info"])
async def get_system_info() -> dict[str, str]:
    return {
        "name": "Ledgerline",
        "slug": "ledgerline",
        "archetype": "Fintech back-office",
        "version": "1.0.0",
        "description": "Accounts-Payable Document Intelligence: multimodal OCR/VLM invoice extraction, automated 3-way matching, and human-in-the-loop review",
    }
