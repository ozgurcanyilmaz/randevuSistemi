import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type WorkingHoursReq = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};
type BreakReq = { dayOfWeek: number; startTime: string; endTime: string };

// Backend uses Sunday=0, Monday=1, etc.
const DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cts"];
const DEFAULT_HOURS: WorkingHoursReq[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "17:00",
}));
const DEFAULT_BREAKS: BreakReq[] = [];

export default function Provider() {
  const [session, setSession] = useState<number>(30);
  const [hours, setHours] = useState<WorkingHoursReq[]>(DEFAULT_HOURS);
  const [breaks, setBreaks] = useState<BreakReq[]>(DEFAULT_BREAKS);
  const [selectedDay, setSelectedDay] = useState<number>(1); // Monday

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState<"session" | "hours" | "breaks" | null>(null);

  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("provider_session");
      const savedHours = localStorage.getItem("provider_hours");
      const savedBreaks = localStorage.getItem("provider_breaks");
      if (savedSession) setSession(JSON.parse(savedSession));
      setHours(savedHours ? JSON.parse(savedHours) : DEFAULT_HOURS);
      setBreaks(savedBreaks ? JSON.parse(savedBreaks) : DEFAULT_BREAKS);
    } catch (e) {
      console.error("loadProviderData error", e);
      setHours(DEFAULT_HOURS);
      setBreaks(DEFAULT_BREAKS);
    }
  }, []);

  const isTimeLT = (a: string, b: string) => a.localeCompare(b) < 0;
  const hoursValid = useMemo(
    () => hours.every((h) => isTimeLT(h.startTime, h.endTime)),
    [hours]
  );
  const breaksValid = useMemo(
    () => breaks.every((b) => isTimeLT(b.startTime, b.endTime)),
    [breaks]
  );
  const sessionValid = useMemo(
    () =>
      Number.isFinite(session) &&
      session >= 5 &&
      session <= 240 &&
      session % 5 === 0,
    [session]
  );

  async function saveSession() {
    setError(null);
    setInfo(null);
    if (!sessionValid) {
      setError("Seans süresi 5–240 dk aralığında ve 5'in katı olmalıdır.");
      return;
    }
    setSaving("session");
    try {
      await api.post(`/provider/session-duration/${session}`);
      localStorage.setItem("provider_session", JSON.stringify(session));
      setInfo("Seans süresi kaydedildi.");
    } catch {
      setError("Seans süresi kaydedilemedi.");
    } finally {
      setSaving(null);
    }
  }

  async function saveHours() {
    setError(null);
    setInfo(null);
    if (!hoursValid) {
      setError("Çalışma saatlerinde başlangıç saati, bitiş saatinden küçük olmalı.");
      return;
    }
    setSaving("hours");
    try {
      await api.post("/provider/working-hours", hours);
      localStorage.setItem("provider_hours", JSON.stringify(hours));
      setInfo("Çalışma saatleri kaydedildi.");
    } catch {
      setError("Çalışma saatleri kaydedilemedi.");
    } finally {
      setSaving(null);
    }
  }

  async function saveBreaks() {
    setError(null);
    setInfo(null);
    if (!breaksValid) {
      setError("Mola saatlerinde başlangıç saati, bitiş saatinden küçük olmalı.");
      return;
    }
    setSaving("breaks");
    try {
      await api.post("/provider/breaks", breaks);
      localStorage.setItem("provider_breaks", JSON.stringify(breaks));
      setInfo("Molalar kaydedildi.");
    } catch {
      setError("Molalar kaydedilemedi.");
    } finally {
      setSaving(null);
    }
  }

  function resetHours() {
    setHours(DEFAULT_HOURS);
    setInfo("Çalışma saatleri varsayana döndürüldü (09:00–17:00).");
  }
  function resetBreaks() {
    setBreaks(DEFAULT_BREAKS);
    setInfo("Molalar varsayana döndürüldü.");
  }

  const selectedDayHours = hours.find(h => h.dayOfWeek === selectedDay);
  const selectedDayBreaks = breaks.filter(b => b.dayOfWeek === selectedDay);

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
    padding: 24,
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)", padding: 24 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 30, fontWeight: "bold", color: "#1e293b", marginBottom: 8 }}>Parametreler</h1>
          <p style={{ color: "#64748b" }}>Seans süresi, çalışma saatleri ve molalarınızı yönetin.</p>
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b" }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 8, color: "#155e75" }}>
            {info}
          </div>
        )}

        {/* Session Duration */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>⏱️ Seans Uzunluğu</h2>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1, maxWidth: 200 }}>
              <label style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>Dakika</label>
              <input
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
                type="number"
                min={5}
                step={5}
                value={session}
                onChange={(e) => setSession(Number(e.target.value))}
              />
            </div>
            <button
              style={{ background: "#2563eb", color: "white", fontWeight: 500, padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
              onClick={saveSession}
              disabled={saving === "session"}
            >
              {saving === "session" ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: sessionValid ? "#64748b" : "#991b1b" }}>
            5–240 dk aralığında ve 5'in katı olmalı.
          </div>
        </div>

        {/* Day Selection */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", marginBottom: 16 }}>📅 Gün Seçin</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DAYS.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                style={{
                  padding: "12px 20px",
                  border: selectedDay === idx ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  background: selectedDay === idx ? "#eff6ff" : "white",
                  color: selectedDay === idx ? "#1d4ed8" : "#334155",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: 14,
                  transition: "all 0.2s"
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Working Hours for Selected Day */}
        <div style={{ ...cardStyle, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: 0 }}>
              🕒 {DAYS[selectedDay]} - Çalışma Saatleri
            </h2>
            <button
              style={{ background: "transparent", color: "#334155", fontWeight: 500, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
              onClick={resetHours}
            >
              Tümünü Sıfırla
            </button>
          </div>

          {selectedDayHours && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>Başlangıç</label>
                <input
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
                  type="time"
                  value={selectedDayHours.startTime}
                  onChange={(e) => setHours(hours.map(h => h.dayOfWeek === selectedDay ? { ...h, startTime: e.target.value } : h))}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>Bitiş</label>
                <input
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
                  type="time"
                  value={selectedDayHours.endTime}
                  onChange={(e) => setHours(hours.map(h => h.dayOfWeek === selectedDay ? { ...h, endTime: e.target.value } : h))}
                />
              </div>
            </div>
          )}

          <button
            style={{ background: "#2563eb", color: "white", fontWeight: 500, padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
            onClick={saveHours}
            disabled={!hoursValid || saving === "hours"}
          >
            {saving === "hours" ? "Kaydediliyor..." : "Çalışma Saatlerini Kaydet"}
          </button>
        </div>

        {/* Breaks for Selected Day */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1e293b", margin: 0 }}>
              ☕ {DAYS[selectedDay]} - Molalar
            </h2>
            <button
              style={{ background: "transparent", color: "#334155", fontWeight: 500, padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
              onClick={resetBreaks}
            >
              Tümünü Sıfırla
            </button>
          </div>

          {selectedDayBreaks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 20px", color: "#94a3b8", background: "#f8fafc", borderRadius: 8, border: "1px dashed #cbd5e1", marginBottom: 12 }}>
              Bu gün için tanımlı mola yok.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
              {selectedDayBreaks.map((b, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>Başlangıç</label>
                    <input
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
                      type="time"
                      value={b.startTime}
                      onChange={(e) => {
                        const allBreaksIdx = breaks.findIndex(br => br === b);
                        setBreaks(breaks.map((br, i) => i === allBreaksIdx ? { ...br, startTime: e.target.value } : br));
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>Bitiş</label>
                    <input
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14 }}
                      type="time"
                      value={b.endTime}
                      onChange={(e) => {
                        const allBreaksIdx = breaks.findIndex(br => br === b);
                        setBreaks(breaks.map((br, i) => i === allBreaksIdx ? { ...br, endTime: e.target.value } : br));
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button
                      style={{ background: "transparent", color: "#dc2626", fontWeight: 500, padding: "10px 16px", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", fontSize: 13 }}
                      onClick={() => setBreaks(breaks.filter(br => br !== b))}
                    >
                      Kaldır
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{ background: "transparent", color: "#334155", fontWeight: 500, padding: "10px 16px", border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
              onClick={() => setBreaks([...breaks, { dayOfWeek: selectedDay, startTime: "12:00", endTime: "13:00" }])}
            >
              + Mola Ekle
            </button>
            <button
              style={{ background: "#2563eb", color: "white", fontWeight: 500, padding: "10px 16px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}
              onClick={saveBreaks}
              disabled={!breaksValid || saving === "breaks"}
            >
              {saving === "breaks" ? "Kaydediliyor..." : "Molaları Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}