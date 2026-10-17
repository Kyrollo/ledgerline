from __future__ import annotations

import csv
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

router = APIRouter(prefix="/files", tags=["files"])

UPLOAD_DIR = Path("data/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

FILE_REGISTRY: dict[str, dict[str, Any]] = {}


class FileMetadata(BaseModel):
    id: str
    filename: str
    size_bytes: int
    content_type: str
    uploaded_at: str
    processed: bool = False
    details: dict[str, Any] = Field(default_factory=dict)


@router.post("/upload", response_model=FileMetadata)
async def upload_file(file: UploadFile = File(...)) -> FileMetadata:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")

    ext = Path(file.filename).suffix.lower()
    allowed_extensions = {".pdf", ".csv", ".xlsx", ".txt", ".json"}
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    file_id = f"file_{uuid.uuid4().hex[:10]}"
    dest_path = UPLOAD_DIR / f"{file_id}_{file.filename}"

    content = await file.read()
    dest_path.write_bytes(content)

    meta = {
        "id": file_id,
        "filename": file.filename,
        "size_bytes": len(content),
        "content_type": file.content_type or "application/octet-stream",
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "processed": False,
        "stored_path": str(dest_path),
        "details": {"extension": ext},
    }
    FILE_REGISTRY[file_id] = meta

    return FileMetadata(**meta)


@router.get("", response_model=list[FileMetadata])
async def list_files() -> list[FileMetadata]:
    return [FileMetadata(**meta) for meta in FILE_REGISTRY.values()]


@router.get("/{file_id}", response_model=FileMetadata)
async def get_file(file_id: str) -> FileMetadata:
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="File record not found")
    return FileMetadata(**FILE_REGISTRY[file_id])


@router.delete("/{file_id}")
async def delete_file(file_id: str) -> dict[str, str]:
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="File record not found")

    stored_path = Path(FILE_REGISTRY[file_id]["stored_path"])
    if stored_path.exists():
        stored_path.unlink()

    del FILE_REGISTRY[file_id]
    return {"status": "deleted", "id": file_id}


@router.post("/{file_id}/process")
async def process_file(file_id: str) -> dict[str, Any]:
    if file_id not in FILE_REGISTRY:
        raise HTTPException(status_code=404, detail="File record not found")

    meta = FILE_REGISTRY[file_id]
    file_path = Path(meta["stored_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Stored file binary missing")

    ext = Path(meta["filename"]).suffix.lower()
    extracted_text = ""
    row_count = 0

    if ext == ".pdf":
        try:
            import pypdf
            reader = pypdf.PdfReader(str(file_path))
            pages_text = [page.extract_text() or "" for page in reader.pages]
            extracted_text = "\n".join(pages_text)
        except Exception as e:
            extracted_text = f"PDF extraction error: {e}"
    elif ext == ".xlsx":
        try:
            import openpyxl
            wb = openpyxl.load_workbook(str(file_path), data_only=True)
            sheet = wb.active
            rows = []
            for r in sheet.iter_rows(values_only=True):
                if any(v is not None for v in r):
                    rows.append(" | ".join(str(v) if v is not None else "" for v in r))
            row_count = len(rows)
            extracted_text = "\n".join(rows)
        except Exception as e:
            extracted_text = f"Excel extraction error: {e}"
    elif ext == ".csv":
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f)
                rows = [" | ".join(r) for r in reader if r]
                row_count = len(rows)
                extracted_text = "\n".join(rows)
        except Exception as e:
            extracted_text = f"CSV extraction error: {e}"
    else:
        extracted_text = file_path.read_text(encoding="utf-8", errors="replace")
        row_count = len(extracted_text.splitlines())

    meta["processed"] = True
    meta["details"]["extracted_characters"] = len(extracted_text)
    meta["details"]["row_count"] = row_count

    return {
        "status": "success",
        "file_id": file_id,
        "filename": meta["filename"],
        "extracted_characters": len(extracted_text),
        "row_count": row_count,
        "preview": extracted_text[:400],
        "message": f"Successfully parsed {meta['filename']} into Accounts Payable intelligence pipeline.",
    }
