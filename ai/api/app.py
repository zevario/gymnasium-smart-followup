"""Inference API prioritas follow-up (v0.5).

Kontrak sama persis dengan yang dipakai backend website
(backend/src/modules/predictions/prediction.service.js askModel):
  POST /predict  {"customers": [{customerId, visits30Days, ..., daysToExpiry}]}
  ->             {"modelVersion", "syntheticTraining", "predictions": [{customerId, priority, score, probabilities}]}
Backend tinggal mengisi INFERENCE_API_URL=http://127.0.0.1:8000 di backend/.env.

Jalankan dari folder ai/:  uvicorn api.app:app --port 8000   (docs: http://localhost:8000/docs)
"""
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field, field_validator

from api import genai

BUNDLE = joblib.load(Path(__file__).resolve().parents[1] / "models" / "priority_model.joblib")
MODEL, FEATURES = BUNDLE["model"], BUNDLE["features"]
MODEL_VERSION = BUNDLE["version"]

app = FastAPI(title="Gymnasyum Priority Inference API", version="0.5.0")


class Customer(BaseModel):
    """Satu baris dari collectFeatures() di backend. null = data belum ada (diisi median train)."""
    # Kolom tambahan diabaikan: bila backend menambah kolom, batch tetap diterima.
    model_config = ConfigDict(extra="ignore")

    customerId: str = Field(min_length=1)
    visits30Days: int = Field(ge=0, description="Hadir/terlambat dalam 30 hari terakhir")
    daysSinceLastVisit: int | None = Field(None, ge=0, description="null = belum pernah hadir")
    attendanceRatio: float | None = Field(None, ge=0, le=1, description="Hadir ÷ semua booking")
    reschedules: int = Field(ge=0, description="Jumlah kehadiran berstatus excused")
    noResponses: int = Field(ge=0, description="Jumlah reminder No Response")
    responseRatio: float | None = Field(None, ge=0, le=1, description="Direspons ÷ terkirim")
    remainingSessions: int | None = Field(None, ge=0, description="null = tidak ada paket aktif")
    daysToExpiry: int | None = Field(None, description="null = paket belum dipakai / tidak ada paket aktif")


class PredictRequest(BaseModel):
    customers: list[Customer] = Field(min_length=1, max_length=1000)

    @field_validator("customers")
    @classmethod
    def unique_ids(cls, customers):
        ids = [c.customerId for c in customers]
        if len(ids) != len(set(ids)):
            raise ValueError("customerId harus unik dalam satu batch")
        return customers


@app.get("/health")
def health():
    return {"status": "ok", "model": BUNDLE["name"], "modelVersion": MODEL_VERSION,
            "features": FEATURES, "classes": ["low", "medium", "high"], "syntheticTraining": True,
            "draft": genai.status()}


@app.post("/draft")
def draft(req: genai.DraftRequest):
    """Draft pesan WhatsApp dari fakta terstruktur. Selalu berhasil: bila Gemini tidak bisa
    dipakai, `source` = "template" dan `reason` menjelaskan sebabnya."""
    return genai.draft(req)


@app.post("/predict")
def predict(req: PredictRequest):
    # None -> NaN, lalu diisi median train oleh imputer di dalam pipeline.
    X = pd.DataFrame([c.model_dump() for c in req.customers])[FEATURES].astype(float)
    predictions = []
    for c, probs in zip(req.customers, MODEL.predict_proba(X)):
        p = {k.lower(): round(float(v), 4) for k, v in zip(MODEL.classes_, probs)}
        priority = max(p, key=p.get)
        predictions.append({
            "customerId": c.customerId,
            "priority": priority,          # low | medium | high, sama dengan prediction_logs.priority
            "score": p[priority],          # peluang kelas terpilih, BUKAN peluang perpanjangan
            "probabilities": p,
        })
    return {"modelVersion": MODEL_VERSION, "syntheticTraining": True, "predictions": predictions}
