# backend/train.py
# -*- coding: utf-8 -*-
import json, os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib

CSV_PATH = r"C:\Users\harnk\OneDrive\Masaüstü\Flight_delay.csv"  # <-- güncelle

def hhmm_to_int(x):
    try:
        x = int(x)
        hh, mm = divmod(x, 100)
        if not (0 <= hh <= 24 and 0 <= mm <= 59):
            return np.nan, np.nan
        return hh, mm
    except Exception:
        return np.nan, np.nan

def main():
    df = pd.read_csv(
        CSV_PATH,
        engine="python",
        quotechar='"',
        escapechar='\\',
        encoding="utf-8"
    )

    need_cols = [
        'DayOfWeek','Date','DepTime','ArrTime','CRSArrTime',
        'UniqueCarrier','Airline','Origin','Dest',
        'ArrDelay'
    ]
    df = df[need_cols].copy()
    # sadece AA / DL / WN
    df = df[df['UniqueCarrier'].isin(['AA','DL','WN'])].copy()
    print("Taşıyıcı dağılımı:\n", df['UniqueCarrier'].value_counts())

    # tarih & saat
    df['Date'] = pd.to_datetime(df['Date'], dayfirst=True, errors='coerce')
    df[['DepHour','DepMinute']] = df['DepTime'].apply(lambda z: pd.Series(hhmm_to_int(z)))
    df[['ArrPlannedHour','ArrPlannedMinute']] = df['CRSArrTime'].apply(lambda z: pd.Series(hhmm_to_int(z)))
    df['Month'] = df['Date'].dt.month
    df['Day']   = df['Date'].dt.day

    before = len(df)
    df = df.dropna(subset=['ArrDelay','DepHour','DepMinute','ArrPlannedHour','ArrPlannedMinute','Month','Day','DayOfWeek','Origin','Dest','UniqueCarrier'])
    print(f"DropNA: {before}->{len(df)}")

    # özellik matrisi (seninle aynı)
    X_num = df[['DayOfWeek','Month','Day','DepHour','DepMinute','ArrPlannedHour','ArrPlannedMinute']].astype(float)
    X_cat = pd.get_dummies(df[['Origin','Dest','UniqueCarrier']], drop_first=True)
    X = pd.concat([X_num, X_cat], axis=1)
    y = df['ArrDelay'].astype(float)

    print("X shape:", X.shape, " y shape:", y.shape)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=0)
    print("Train:", X_train.shape, "Test:", X_test.shape)

    xgb_reg = xgb.XGBRegressor(
        random_state=0,
        tree_method='hist',
        n_estimators=400,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        n_jobs=-1
    )
    xgb_reg.fit(X_train, y_train)

    y_pred = xgb_reg.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred)
    mse  = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
   
    r2   = r2_score(y_test, y_pred)
    print(f"MAE: {mae:.2f} dk | RMSE: {rmse:.2f} dk | R²: {r2:.3f}")

    # model + kolonları kaydet
    joblib.dump(xgb_reg, "model.pkl")
    with open("columns.json", "w", encoding="utf-8") as f:
        json.dump({"columns": list(X.columns)}, f, ensure_ascii=False, indent=2)

    print("✅ Kaydedildi: model.pkl & columns.json")

if __name__ == "__main__":
    main()
