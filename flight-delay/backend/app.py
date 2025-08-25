# backend/app.py
# -*- coding: utf-8 -*-
import os, json
import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------- Yollar (model ve kolon dosyaları backend klasöründe) ----------
HERE = os.path.dirname(__file__)
MODEL_PATH   = os.path.join(HERE, "model.pkl")
COLUMNS_PATH = os.path.join(HERE, "columns.json")

# ---------- Yardımcılar (train.py ile birebir) ----------
def hhmm_to_int(x):
    try:
        x = int(x)
        hh, mm = divmod(x, 100)
        if not (0 <= hh <= 24 and 0 <= mm <= 59):
            return np.nan, np.nan
        return hh, mm
    except Exception:
        return np.nan, np.nan

# ---------- API tanımı ----------
app = FastAPI(title="Flight Delay API", version="0.1.0")

# Frontend’ten çağıracağız; şimdilik localhost’a izin ver
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:5173","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Yükler
model = joblib.load(MODEL_PATH)
with open(COLUMNS_PATH, "r", encoding="utf-8") as f:
    COLUMNS = json.load(f)["columns"]

# ---------- İstek şeması ----------
class PredictIn(BaseModel):
    date_str: str         # "YYYY-MM-DD"
    dep_hhmm: str         # "1829" gibi
    crs_arr_hhmm: str     # planlı varış "1925"
    origin: str           # "IND"
    dest: str             # "BWI"
    carrier: str          # "WN" | "AA" | "DL"

# ---------- Sağlık kontrolü ----------
@app.get("/health")
def health():
    return {"status": "ok"}

# ---------- Tahmin ----------
# ---------- Tahmin ----------
@app.post("/predict")
def predict(p: PredictIn):
    # 1) Takvim & saat
    dt = pd.to_datetime(p.date_str)
    month, day, dow = dt.month, dt.day, (dt.weekday() + 1)

    dh, dm = hhmm_to_int(p.dep_hhmm)
    ah, am = hhmm_to_int(p.crs_arr_hhmm)

    # 2) Boş (0) vektör + sayısalları yaz
    row = pd.DataFrame([{col: 0.0 for col in COLUMNS}], dtype=float)
    row.at[0, 'DayOfWeek'] = float(dow)
    row.at[0, 'Month'] = float(month)
    row.at[0, 'Day'] = float(day)
    row.at[0, 'DepHour'] = float(dh)
    row.at[0, 'DepMinute'] = float(dm)
    row.at[0, 'ArrPlannedHour'] = float(ah)
    row.at[0, 'ArrPlannedMinute'] = float(am)

    # 3) Kategorikleri ilgili dummy sütununa 1 olarak bas (varsa)
    origin = p.origin.upper()
    dest = p.dest.upper()
    carrier = p.carrier.upper()

    col = f'Origin_{origin}'
    if col in COLUMNS: row.at[0, col] = 1.0

    col = f'Dest_{dest}'
    if col in COLUMNS: row.at[0, col] = 1.0

    col = f'UniqueCarrier_{carrier}'
    if col in COLUMNS: row.at[0, col] = 1.0
    # Not: Eğer bir sütun yoksa bu, o kategorinin eğitimdeki “baz” (drop_first) olduğunu
    # veya tamamen görülmediğini gösterir. Bu durumda 0’lar doğru davranıştır.

    # 4) Tahmin ve HHMM formatlama
    pred_delay = float(model.predict(row)[0])

    base_min = int(ah) * 60 + int(am)
    pred_arr_min = (base_min + int(round(pred_delay))) % (24 * 60)
    hh = pred_arr_min // 60
    mm = pred_arr_min % 60
    pred_arr_hhmm = f"{hh:02d}{mm:02d}"

    return {
        "pred_delay_min": pred_delay,
        "pred_arrival_hhmm": pred_arr_hhmm
    }
