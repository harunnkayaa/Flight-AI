import { useRef, useState } from "react";
import axios from "axios";
import "./App.css";

/* ── helpers ───────────────────────────────────────────── */
const onlyDigits = (s = "") => (s || "").replace(/\D/g, "");

// YAZARKEN: pad yok, sadece nokta konumlandır
const maskHHMM = (s = "") => {
  const d = onlyDigits(s).slice(0, 4);
  if (d.length <= 2) return d;                 // "2" -> "2", "20" -> "20"
  return `${d.slice(0, 2)}.${d.slice(2)}`;     // "200" -> "20.0", "2000" -> "20.00"
};

// API'ye göndermek için düz HHMM
const hhmmToPlain = (s = "") => {
  const d = onlyDigits(s).slice(0, 4);
  return d.length === 4 ? d : "";
};
// "2024" -> "20.24" çevir
const formatHHMM = (val = "") => {
  if (!val || val.length !== 4) return val;
  return `${val.slice(0,2)}.${val.slice(2)}`;
};


// BLUR: pad + aralık kontrolü (00–23 / 00–59)
// Geçersizse null, 2+ rakam yoksa "" döner (kullanıcı yazmaya devam eder)
const normalizeHHMM = (s = "") => {
  const d = onlyDigits(s).slice(0, 4);
  if (d.length < 3) return "";                 // yeterli veri yok, olduğu gibi bırak
  const hh = parseInt(d.slice(0, 2), 10);
  const mm = parseInt((d.slice(2) || "0").padEnd(2, "0"), 10);
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh > 23 || mm > 59) return null;
  return `${String(hh).padStart(2, "0")}.${String(mm).padStart(2, "0")}`;
};

const toISODate = (display = "") => {
  const m = (display || "").match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return "";
  const [, gg, aa, yyyy] = m;
  return `${yyyy}-${aa}-${gg}`;
};
const fromISOToDot = (iso = "") => {
  const m = (iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [, y, mo, d] = m;
  return `${d}.${mo}.${y}`;
};


/* ── seed lists ─────────────────────────────────────────── */
const AIRPORTS = [
  "ATL","BOS","BWI","CLT","DAL","DEN","DFW","DTW","EWR","FLL","HOU","IAD","IAH",
  "IND","JFK","LAS","LAX","LGA","MCO","MIA","MSP","ORD","PHL","PHX","SAN","SEA",
  "SFO","SLC","TPA",
];
const CARRIERS = ["AA", "DL", "WN"];
const SAMPLE = {
  date: "01.03.2019",
  depHHMM: "18.29",
  crsArrHHMM: "19.25",
  origin: "IND",
  dest: "BWI",
  carrier: "WN",
};

export default function App() {
  const [form, setForm] = useState({
    date: "",
    depHHMM: "",
    crsArrHHMM: "",
    origin: "",
    dest: "",
    carrier: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const hiddenDateRef = useRef(null);

  const onChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "depHHMM" || name === "crsArrHHMM") {
      return setForm((f) => ({ ...f, [name]: maskHHMM(value) }));
    }
    setForm((f) => ({ ...f, [name]: value }));
  };

  // time inputs blur -> normalize
  const onBlurTime = (name) => {
    setForm((f) => {
      const norm = normalizeHHMM(f[name]);
      return norm === null ? f : { ...f, [name]: norm };
    });
  };

  const openDatePicker = () => {
    const iso = toISODate(form.date);
    if (hiddenDateRef.current) {
      hiddenDateRef.current.value = iso || "";
      hiddenDateRef.current.showPicker?.();
      hiddenDateRef.current.click?.();
    }
  };
  const onDatePicked = (e) =>
    setForm((f) => ({ ...f, date: fromISOToDot(e.target.value) }));



const onSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setResult(null);
  try {
    // Havalimanı kontrolü
    if (form.origin && form.dest && form.origin === form.dest) {
      throw new Error("Aynı havalimanı seçilemez: kalkış ve varış farklı olmalı.");
    }

    // Saat kontrolü
    if (form.depHHMM && form.crsArrHHMM && form.depHHMM === form.crsArrHHMM) {
      throw new Error("Kalkış ve varış saati aynı olamaz!");
    }

    // geçerlilik kontrolü
    const depNorm = normalizeHHMM(form.depHHMM);
    const arrNorm = normalizeHHMM(form.crsArrHHMM);
    if (!depNorm || !arrNorm) {
      throw new Error("Saat formatı geçersiz. Lütfen HH.MM (örn: 20.00) girin.");
    }

    const payload = {
      date_str: toISODate(form.date),
      dep_hhmm: hhmmToPlain(form.depHHMM),
      crs_arr_hhmm: hhmmToPlain(form.crsArrHHMM),
      origin: (form.origin || "").toUpperCase(),
      dest: (form.dest || "").toUpperCase(),
      carrier: (form.carrier || "").toUpperCase(),
    };

    if (
      !payload.date_str ||
      payload.dep_hhmm.length !== 4 ||
      payload.crs_arr_hhmm.length !== 4 ||
      !payload.origin ||
      !payload.dest ||
      !payload.carrier
    ) {
      throw new Error("Lütfen tüm alanları geçerli formatta doldurun.");
    }

    const resp = await axios.post("/api/predict", payload);
    setResult(resp.data);
  } catch (err) {
    setError(err.response?.data || err.message);
  } finally {
    setLoading(false);
  }
};


  const delay = result?.pred_delay_min ?? result?.tahmini_varis_gecikmesi_dk;
  const arrival = result?.pred_arrival_hhmm ?? result?.tahmini_varis_saati_hhmm;

  return (
    <div className="page">{/* ← yeni kapsayıcı */}
   <div className="fx" aria-hidden="true">
   <div className="sky"></div>   {/* burası senin görsel */}
  <div className="ai-grid"></div>
  <div className="cloud cloud-1"></div>
  <div className="cloud cloud-2"></div>
  <div className="cloud cloud-3"></div>

 
  {/* yalnızca senin görsel uçağın */}
  <div className="plane" />
</div>
      <div className="wrap">
        <section className="banner">
          <div className="badge">✈️ Flight AI</div>
          <h1>Uçuş Gecikme Tahmini</h1>
          <p>Rota, saat ve taşıyıcı bilgilerine göre varış gecikmesini tahmin edin.</p>
        </section>

        <form className="grid" onSubmit={onSubmit}>
          {/* Tarih */}
          <div className="field">
            <label>Tarih</label>
            <div className="input-group">
              <input
                name="date"
                inputMode="numeric"
                placeholder="gg.aa.yyyy"
                value={form.date}
                onChange={onChange}
              />
              <button type="button" className="icon-btn" onClick={openDatePicker} aria-label="Takvim">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M7 2v2H5a2 2 0 0 0-2 2v2h18V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm14 8H3v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V10z"/>
                </svg>
              </button>
              <input
                ref={hiddenDateRef}
                type="date"
                className="hidden-date"
                onChange={onDatePicked}
              />
            </div>
            <small>Örn: 01.03.2019</small>
          </div>

          {/* Kalkış (HH.MM) */}
          <div className="field">
            <label>Kalkış (HH.MM)</label>
            <input
              name="depHHMM"
              inputMode="numeric"
              placeholder="18.30"
              value={form.depHHMM}
              onChange={onChange}
              onBlur={() => onBlurTime("depHHMM")}
              maxLength={5}
            />
          </div>

          {/* Planlanan Varış (HH.MM) */}
          <div className="field">
            <label>Planlanan Varış (HH.MM)</label>
            <input
              name="crsArrHHMM"
              inputMode="numeric"
              placeholder="19.25"
              value={form.crsArrHHMM}
              onChange={onChange}
              onBlur={() => onBlurTime("crsArrHHMM")}
              maxLength={5}
            />
          </div>

          {/* Kalkış/Varış Havalimanları */}
        <div className="field">
    <label>Kalkış Havalimanı (IATA)</label>
  <select name="origin" value={form.origin} onChange={onChange} required>
    <option value="" disabled>Seçiniz</option>
    {AIRPORTS.map((a) => (
      <option key={a} value={a} disabled={a === form.dest}>
        {a}
      </option>
    ))}
  </select>
</div>

{/* Varış Havalimanı (IATA) */}
<div className="field">
  <label>Varış Havalimanı (IATA)</label>
  <select name="dest" value={form.dest} onChange={onChange} required>
    <option value="" disabled>Seçiniz</option>
    {AIRPORTS.map((a) => (
      <option key={a} value={a} disabled={a === form.origin}>
        {a}
      </option>
    ))}
  </select>
</div>
          <datalist id="iata">
            {AIRPORTS.map((a) => <option key={a} value={a} />)}
          </datalist>

          {/* Taşıyıcı */}
          <div className="field">
            <label>Taşıyıcı</label>
            <select name="carrier" value={form.carrier} onChange={onChange}>
              <option value="" disabled>Seçiniz</option>
              {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

         {/* Actions */}
          <div className="actions">
           
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? "Hesaplanıyor…" : "Tahmin Al"}
            </button>
          </div>
        </form> 

        {/* Quick glance chips */}
        {!!form.origin && !!form.dest && (
          <div className="chips">
            <span className="chip">
              Rota: <b>{form.origin.toUpperCase()} → {form.dest.toUpperCase()}</b>
            </span>
            {!!form.carrier && <span className="chip">Taşıyıcı: <b>{form.carrier}</b></span>}
            {!!form.depHHMM && <span className="chip">Kalkış: <b>{form.depHHMM}</b></span>}
            {!!form.crsArrHHMM && <span className="chip">Varış(pln): <b>{form.crsArrHHMM}</b></span>}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card error">
            <h3>Hata</h3>
            <pre>{typeof error === "string" ? error : JSON.stringify(error, null, 2)}</pre>
          </div>
        )}


        {/* Result */}
        {result && (
          <div className="card success flight-card">
            <div className="route">
              <div className="code">{form.origin || "—"}</div>
              <div className="plane">✈</div>
              <div className="code">{form.dest || "—"}</div>
            </div>
            <div className="kv">
              <span>Tahmini gecikme</span>
              <b>{typeof delay === "number" ? `${delay.toFixed(1)} dk` : delay}</b>
            </div>
            <div className="kv">
              <span>Tahmini varış</span>
              <b>{formatHHMM(arrival)}</b>
            </div>
          </div>
        )}

        <footer className="foot">Deneysel model — sonuçlar tahminidir.</footer>
      </div>
    </div>
    
  );
  
}
