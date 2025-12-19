"""ClaimClean verification microservice (Phase 1).
Performs doc fetch, hash validation, and simple anomaly scoring.
"""

from __future__ import annotations

import hashlib
import io
from datetime import datetime
import os
from typing import Any, Dict, List, Optional, Tuple

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
import imagehash
import exifread
from haversine import haversine

app = FastAPI(title="ClaimClean Audit AI", version="0.1.0")


class DocumentPayload(BaseModel):
    id: str
    docType: str
    url: str
    sha256: str
    phash: Optional[str] = None
    mimeType: str
    meta: Optional[Dict[str, Any]] = None


class ClaimPayload(BaseModel):
    id: Optional[str] = None
    brandId: str
    recyclerId: str
    facilityId: str
    period: Dict[str, Any]
    claimedWeightKg: float


class AuditRequest(BaseModel):
    claim: ClaimPayload
    documents: List[DocumentPayload]


class Issue(BaseModel):
    code: str
    severity: str
    message: str


class AuditResponse(BaseModel):
    score: float
    issues: List[Issue]
    report: Dict[str, Any]
    reportHash: str


FETCH_TIMEOUT = int(os.getenv("CLAIM_AUDIT_FETCH_TIMEOUT", "10"))
NEAR_DUP_THRESHOLD = 5


def fetch_bytes(url: str) -> bytes:
    try:
        response = requests.get(url, timeout=FETCH_TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise HTTPException(status_code=400, detail=f"Failed to download {url}: {exc}") from exc
    return response.content


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def compute_phash(data: bytes, mime_type: str) -> Optional[str]:
    if not mime_type.lower().startswith("image/"):
        return None
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
        return str(imagehash.phash(img))
    except Exception:
        return None


def read_exif_ts(data: bytes) -> Optional[str]:
    try:
        tags = exifread.process_file(io.BytesIO(data), details=False)
    except Exception:
        return None
    for key in ("EXIF DateTimeOriginal", "Image DateTime"):
        if key in tags:
            return str(tags[key])
    return None


def parse_exif_datetime_gps(b: bytes) -> Tuple[Optional[datetime], Optional[Tuple[float, float]]]:
    try:
        f = io.BytesIO(b)
        tags = exifread.process_file(f, details=False)
        date = None
        for key in ('EXIF DateTimeOriginal', 'Image DateTime'):
            if key in tags:
                try:
                    date = datetime.strptime(str(tags[key]), '%Y:%m:%d %H:%M:%S')
                    break
                except Exception:
                    pass
        gps_lat = tags.get('GPS GPSLatitude'); gps_lat_ref = tags.get('GPS GPSLatitudeRef')
        gps_lon = tags.get('GPS GPSLongitude'); gps_lon_ref = tags.get('GPS GPSLongitudeRef')
        coord = None
        if gps_lat and gps_lon and gps_lat_ref and gps_lon_ref:
            def _r(v): return float(v.num)/float(v.den) if hasattr(v,'num') else float(v)
            lat = _r(gps_lat.values[0]) + _r(gps_lat.values[1])/60.0 + _r(gps_lat.values[2])/3600.0
            lon = _r(gps_lon.values[0]) + _r(gps_lon.values[1])/60.0 + _r(gps_lon.values[2])/3600.0
            if str(gps_lat_ref).upper() == 'S': lat = -lat
            if str(gps_lon_ref).upper() == 'W': lon = -lon
            coord = (lat, lon)
        return date, coord
    except Exception:
        return None, None


@app.post("/audit/claim", response_model=AuditResponse)
def audit_claim(payload: AuditRequest) -> AuditResponse:
    issues: List[Issue] = []
    seen_sha: Dict[str, str] = {}
    seen_phash: Dict[str, str] = {}

    facility_gps = payload.claim.facilityGps if hasattr(payload.claim, 'facilityGps') else None
    claim_from = payload.claim.period.get('from')
    claim_to = payload.claim.period.get('to')
    try:
        period_from = datetime.fromisoformat(claim_from.replace('Z','')) if claim_from else None
        period_to = datetime.fromisoformat(claim_to.replace('Z','')) if claim_to else None
    except Exception:
        period_from = period_to = None

    documents_processed: List[Dict[str, Any]] = []

    for doc in payload.documents:
        try:
            content = fetch_bytes(doc.url)
        except HTTPException as exc:
            issues.append(Issue(code="DOC_FETCH_FAIL", severity="high", message=str(exc.detail)))
            continue

        calc_sha = sha256_bytes(content)
        if calc_sha != doc.sha256:
            issues.append(Issue(code="SHA_MISMATCH", severity="high", message=f"SHA mismatch for {doc.id}"))

        phash_value = doc.phash or compute_phash(content, doc.mimeType)

        if calc_sha in seen_sha:
            issues.append(Issue(code="DUP_SHA", severity="high", message=f"Duplicate with {seen_sha[calc_sha]}"))
        else:
            seen_sha[calc_sha] = doc.id

        if phash_value:
            for previous, previous_id in seen_phash.items():
                try:
                    if imagehash.hex_to_hash(phash_value) - imagehash.hex_to_hash(previous) <= NEAR_DUP_THRESHOLD:
                        issues.append(
                            Issue(
                                code="NEAR_DUP_PHASH",
                                severity="med",
                                message=f"Near duplicate {doc.id} ~ {previous_id}",
                            )
                        )
                except Exception:
                    continue
            seen_phash[phash_value] = doc.id

            # EXIF checks
            exif_dt, exif_gps = parse_exif_datetime_gps(content)
            if exif_dt and period_from and period_to:
                if not (period_from <= exif_dt <= period_to):
                    issues.append(Issue(code="TIMESTAMP_OUTSIDE_PERIOD", severity="med", message=f"Photo {doc.id} timestamp outside claim period"))
            if exif_gps and facility_gps:
                try:
                    dist_km = haversine((exif_gps[0], exif_gps[1]), (facility_gps[0], facility_gps[1]))
                    if dist_km > 10:
                        issues.append(Issue(code="GPS_MISMATCH", severity="med", message=f"Photo {doc.id} GPS {round(dist_km,1)}km from facility"))
                except Exception:
                    pass

        # license expiry (if metadata contains expiryDate ISO string)
        if doc.docType == 'license':
            exp = None
            if doc.meta and doc.meta.get('expiryDate'):
                try:
                    exp = datetime.fromisoformat(doc.meta['expiryDate'].replace('Z',''))
                except Exception:
                    pass
            if exp and exp < datetime.utcnow():
                issues.append(Issue(code="LICENSE_EXPIRED", severity="high", message=f"License {doc.id} is expired"))

        exif_timestamp = read_exif_ts(content)
        documents_processed.append({
            "id": doc.id,
            "sha256": calc_sha,
            "phash": phash_value,
            "exifTimestamp": exif_timestamp,
        })

    score = 100.0
    penalty_map = {
        "DOC_FETCH_FAIL": 40,
        "SHA_MISMATCH": 60,
        "DUP_SHA": 55,
        "NEAR_DUP_PHASH": 15,
        "TIMESTAMP_OUTSIDE_PERIOD": 30,
        "GPS_MISMATCH": 25,
        "LICENSE_EXPIRED": 40,
    }
    for issue in issues:
        score -= penalty_map.get(issue.code, 10)
    score = max(0.0, min(100.0, score))

    report = {
        "model_version": "cc-mvp-0.2",
        "timestamp": datetime.utcnow().isoformat()+'Z',
        "claim": payload.claim.model_dump(),
        "documents_checked": [d["id"] for d in documents_processed],
        "issues": [issue.model_dump() for issue in issues],
        "score": score,
        "meta": {"ruleset":"default"}
    }

    report_hash = sha256_bytes(str(report).encode("utf-8"))

    return AuditResponse(score=score, issues=issues, report=report, reportHash=report_hash)


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "service": "claimclean-audit-ai",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
