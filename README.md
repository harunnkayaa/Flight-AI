# Flight-AI ✈️ — Uçuş Gecikme Tahmini

Uçuş tarihi, kalkış saati, planlanan varış saati, kalkış/varış havalimanları (IATA) ve taşıyıcı bilgilerine göre **varış gecikmesi (dk)** ve **tahmini varış saati** üreten bir makine öğrenmesi uygulaması.  
Backend **FastAPI**, model **XGBoost**, frontend **React** (Vite) ile geliştirildi.

<p>
  <img src="docs/images/ui-1.png" alt="Ana ekran" width="900"/>
</p>

---

## İçerik
- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Kurulum](#kurulum)
  - [Backend (FastAPI)](#backend-fastapi)
  - [Frontend (React)](#frontend-react)
- [API](#api)
- [Model](#model)
- [Dizin Yapısı](#dizin-yapısı)
- [Geliştirme Notları](#geliştirme-notları)
- [Lisans](#lisans)

---

## Özellikler

- ✨ **ML model**: XGBoost ile varış gecikmesi ve varış saati tahmini  
- ⚡ **FastAPI**: Hafif, hızlı REST API (Uvicorn ile çalışır)  
- 🎯 **Ön yüz**: React (Vite), modern arayüz, **uçak animasyonu** ve gökyüzü arka planı  
- 🧭 **Form doğrulama**:
  - Kalkış–varış **aynı havalimanı seçilemez**
  - Kalkış ve planlanan varış **aynı saat olamaz** (anında uyarı)
- 🔎 **Zaman giriş maskesi**: `HH.MM` (yazarken nokta yerleşir; blur’da normalize)  
- 🧾 **Özet chip’ler**: Seçilen rota, taşıyıcı ve saatler mini rozetler halinde  
- 🟩 **Sonuç kartı**: Tahmini gecikme (dk) ve varış saati

---

## Mimari

