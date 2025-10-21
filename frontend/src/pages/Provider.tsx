import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type WorkingHoursReq = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};
type BreakReq = { dayOfWeek: number; startTime: string; endTime: string };

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];
const DEFAULT_HOURS: WorkingHoursReq[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "17:00",
}));
const DEFAULT_BREAKS: BreakReq[] = [
  { dayOfWeek: 1, startTime: "12:00", endTime: "13:00" },
];

export default function Provider() {
  const [session, setSession] = useState<number>(30);
  const [hours, setHours] = useState<WorkingHoursReq[]>(DEFAULT_HOURS);
  const [breaks, setBreaks] = useState<BreakReq[]>(DEFAULT_BREAKS);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState<"session" | "hours" | "breaks" | null>(
    null
  );

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
      setError("Seans süresi 5–240 dk aralığında ve 5’in katı olmalıdır.");
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
      setError(
        "Çalışma saatlerinde başlangıç saati, bitiş saatinden küçük olmalı."
      );
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
      setError(
        "Mola saatlerinde başlangıç saati, bitiş saatinden küçük olmalı."
      );
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

  const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
    padding: 24,
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 14,
    background: "white",
  };
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    color: "#334155",
    marginBottom: 6,
  };
  const primaryBtn: React.CSSProperties = {
    background: "#2563eb",
    color: "white",
    fontWeight: 500,
    padding: "10px 16px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    transition: "all .2s",
    whiteSpace: "nowrap",
  };
  const secondaryBtn: React.CSSProperties = {
    background: "transparent",
    color: "#334155",
    fontWeight: 500,
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    transition: "all .2s",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 30,
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: 8,
            }}
          >
            Parametreler
          </h1>
          <p style={{ color: "#64748b" }}>
            Seans süresi, çalışma saatleri ve molalarınızı yönetin.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}
        {info && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "#ecfeff",
              border: "1px solid #a5f3fc",
              borderRadius: 8,
              color: "#155e75",
            }}
          >
            {info}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          <div style={cardStyle}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1e293b",
                marginBottom: 16,
              }}
            >
              Seans Uzunluğu
            </h2>
            <label style={labelStyle}>Dakika</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...inputStyle, maxWidth: 160 }}
                type="number"
                min={5}
                step={5}
                value={session}
                onChange={(e) => setSession(Number(e.target.value))}
              />
              <button
                style={primaryBtn}
                onClick={saveSession}
                disabled={saving === "session"}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#1d4ed8")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#2563eb")
                }
              >
                {saving === "session" ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: sessionValid ? "#64748b" : "#991b1b",
              }}
            >
              5–240 dk aralığında ve 5’in katı olmalı.
            </div>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Çalışma Saatleri
              </h2>
              <button
                style={secondaryBtn}
                onClick={resetHours}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Varsayılana Döndür
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Gün</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Başlangıç</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Bitiş</div>

              {hours.map((h, idx) => {
                const valid = isTimeLT(h.startTime, h.endTime);
                return (
                  <div key={idx} style={{ display: "contents" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        color: "#334155",
                      }}
                    >
                      {DAYS[h.dayOfWeek]}
                    </div>
                    <div>
                      <input
                        style={{
                          ...inputStyle,
                          borderColor: valid ? "#cbd5e1" : "#fca5a5",
                        }}
                        type="time"
                        value={h.startTime}
                        onChange={(e) =>
                          setHours((p) =>
                            p.map((x, i) =>
                              i === idx
                                ? { ...x, startTime: e.target.value }
                                : x
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <input
                        style={{
                          ...inputStyle,
                          borderColor: valid ? "#cbd5e1" : "#fca5a5",
                        }}
                        type="time"
                        value={h.endTime}
                        onChange={(e) =>
                          setHours((p) =>
                            p.map((x, i) =>
                              i === idx ? { ...x, endTime: e.target.value } : x
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {!hoursValid && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b" }}>
                Başlangıç saati bitiş saatinden küçük olmalıdır.
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <button
                style={primaryBtn}
                onClick={saveHours}
                disabled={!hoursValid || saving === "hours"}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#1d4ed8")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#2563eb")
                }
              >
                {saving === "hours"
                  ? "Kaydediliyor..."
                  : "Çalışma Saatlerini Kaydet"}
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                Molalar
              </h2>
              <button
                style={secondaryBtn}
                onClick={resetBreaks}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Varsayılana Döndür
              </button>
            </div>

            {breaks.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 20px",
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px dashed #cbd5e1",
                  marginBottom: 12,
                }}
              >
                Şu anda tanımlı mola yok. Aşağıdan ekleyebilirsiniz.
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr auto",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Gün</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Başlangıç</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Bitiş</div>
              <div />

              {breaks.map((b, idx) => {
                const valid = isTimeLT(b.startTime, b.endTime);
                return (
                  <div key={idx} style={{ display: "contents" }}>
                    <div>
                      <select
                        style={inputStyle}
                        value={b.dayOfWeek}
                        onChange={(e) =>
                          setBreaks((p) =>
                            p.map((x, i) =>
                              i === idx
                                ? { ...x, dayOfWeek: Number(e.target.value) }
                                : x
                            )
                          )
                        }
                      >
                        {DAYS.map((d, i) => (
                          <option key={i} value={i}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        style={{
                          ...inputStyle,
                          borderColor: valid ? "#cbd5e1" : "#fca5a5",
                        }}
                        type="time"
                        value={b.startTime}
                        onChange={(e) =>
                          setBreaks((p) =>
                            p.map((x, i) =>
                              i === idx
                                ? { ...x, startTime: e.target.value }
                                : x
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <input
                        style={{
                          ...inputStyle,
                          borderColor: valid ? "#cbd5e1" : "#fca5a5",
                        }}
                        type="time"
                        value={b.endTime}
                        onChange={(e) =>
                          setBreaks((p) =>
                            p.map((x, i) =>
                              i === idx ? { ...x, endTime: e.target.value } : x
                            )
                          )
                        }
                      />
                    </div>
                    <div>
                      <button
                        style={secondaryBtn}
                        onClick={() =>
                          setBreaks((p) => p.filter((_, i) => i !== idx))
                        }
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background = "#fef2f2")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!breaksValid && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b" }}>
                Başlangıç saati bitiş saatinden küçük olmalıdır.
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                style={secondaryBtn}
                onClick={() =>
                  setBreaks((p) => [
                    ...p,
                    { dayOfWeek: 1, startTime: "10:00", endTime: "10:15" },
                  ])
                }
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#f1f5f9")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Mola Ekle
              </button>
              <button
                style={primaryBtn}
                onClick={saveBreaks}
                disabled={!breaksValid || saving === "breaks"}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#1d4ed8")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#2563eb")
                }
              >
                {saving === "breaks" ? "Kaydediliyor..." : "Molayı Kaydet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
