# Flight-AI ✈️ — Uçuş Gecikme Tahmini

Uçuş tarihi, kalkış/varış saatleri, havalimanları (IATA) ve taşıyıcı bilgilerine göre **uçuş gecikmesi (dk)** ve **tahmini varış saatini** tahmin eden bir makine öğrenmesi uygulaması.  
Backend: **FastAPI** · Model: **XGBoost** · Frontend: **React (Vite)**

---

## İçerik
- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Kurulum](#kurulum)

---

## Özellikler
- ✨ **Makine öğrenmesi**: XGBoost ile eğitilmiş model  
- ⚡ **FastAPI**: REST API servisi (Uvicorn ile)  
- 🎨 **React (Vite)**: Modern, hızlı ve animasyonlu kullanıcı arayüzü  
- 🧾 **Özet kartı**: Rota, taşıyıcı, kalkış/varış saati ve tahmini gecikme  
- ☁️ **Arka plan & uçak animasyonu**: Daha sezgisel bir deneyim

---

## Mimari
- **Backend (FastAPI)** → Kullanıcıdan gelen girdileri alır, doğrular ve modeli çağırır.  
- **Model (XGBoost)** → Eğitimli gecikme tahmin modeli. Dakika cinsinden gecikmeyi ve tahmini varış saatini döndürür.  
- **Frontend (React)** → Kullanıcı giriş formu, validasyon, özet bilgileri ve sonuç kartını gösterir. Axios ile API’ye bağlanır.  

---

## Ekran Görüntüleri

<p align="center">
  <img src="docs/images/ui1.png" alt="Form ekranı" width="800"/>
</p>

<p align="center">
  <img src="docs/images/ui2.png" alt="Sonuç ekranı" width="800"/>
</p>

---

## Kurulum

### Backend (FastAPI)


**cd flight-delay/backend**
**python -m venv .venv**
**.venv\Scripts\activate**
**pip install -r requirements.txt**
**uvicorn main:app --reload --port 8000**


---

### Frontend (React)

**cd flight-delay/frontend**
**npm install**
**npm run dev**
