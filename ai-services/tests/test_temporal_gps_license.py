import pytest
from datetime import datetime
from claim_audit_service import parse_exif_datetime_gps, audit_claim
from fastapi.testclient import TestClient
from claim_audit_service import app

client = TestClient(app)

def test_timestamp_outside_period(client):
    payload = {
        "claim": {
            "period": {"from":"2024-12-01T00:00:00Z","to":"2024-12-31T23:59:59Z"},
            "facilityGps": [28.6139, 77.2090]  # Delhi coordinates
        },
        "documents": [{
            "id":"p1","docType":"photo","url":"http://localhost/static/image_out_of_period.jpg",
            "sha256":"<correct>", "mimeType":"image/jpeg"
        }]
    }
    response = client.post("/audit/claim", json=payload)
    assert response.status_code == 200
    issues = response.json()["issues"]
    assert any(i["code"]=="TIMESTAMP_OUTSIDE_PERIOD" for i in issues)

def test_gps_mismatch(client):
    payload = {
        "claim": {
            "period": {"from":"2024-12-01T00:00:00Z","to":"2024-12-31T23:59:59Z"},
            "facilityGps": [28.6139, 77.2090]  # Delhi coordinates
        },
        "documents": [{
            "id":"p1","docType":"photo","url":"http://localhost/static/image_far_gps.jpg",
            "sha256":"<correct>", "mimeType":"image/jpeg"
        }]
    }
    response = client.post("/audit/claim", json=payload)
    assert response.status_code == 200
    issues = response.json()["issues"]
    assert any(i["code"]=="GPS_MISMATCH" for i in issues)

def test_license_expired(client):
    payload = {
        "claim": {
            "period": {"from":"2024-12-01T00:00:00Z","to":"2024-12-31T23:59:59Z"}
        },
        "documents": [{
            "id":"lic1","docType":"license","url":"http://localhost/static/doc.pdf",
            "sha256":"<correct>", "mimeType":"application/pdf",
            "meta":{"expiryDate":"2024-01-01T00:00:00Z"}
        }]
    }
    response = client.post("/audit/claim", json=payload)
    assert response.status_code == 200
    issues = response.json()["issues"]
    assert any(i["code"]=="LICENSE_EXPIRED" for i in issues)