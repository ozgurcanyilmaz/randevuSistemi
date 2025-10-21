import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";

type WaitingItem = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  checkedInAt: string;
  fullName?: string;
};

const REFRESH_MS = 10_000;

export default function ProviderWaiting() {
  const [items, setItems] = useState<WaitingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const timerRef = useRef<number | null>(null);

  const pad = (n: number) => String(n).padStart(2, "0");
  const todayLocalStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const toDate = (dStr: string, tStr?: string) => {
    if (tStr) return new Date(`${dStr}T${tStr}`);
    return new Date(dStr);
  };

  const normalizeToYMD = (dStr: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) return dStr;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const isToday = (dStr: string) => normalizeToYMD(dStr) === todayLocalStr;

  const formatDate = (dStr?: string) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    const parts = dStr.split("-");
    return parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dStr;
  };
  const formatTime = (t: string) => t;
  const formatDateTime = (s?: string) =>
    s
      ? new Date(s).toLocaleString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "";

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<WaitingItem[]>("/provider/waiting");
      setItems(data ?? []);
      setLastUpdated(new Date());
    } catch {
      setError("Bekleyen kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(load, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [autoRefresh]);

  const now = new Date();

  const todays = useMemo(
    () => items.filter((a) => isToday(a.date)),
    [items, todayLocalStr]
  );

  const todaysUpcoming = useMemo(
    () =>
      todays
        .filter((a) => toDate(a.date, a.startTime).getTime() >= now.getTime())
        .sort(
          (a, b) =>
            toDate(a.date, a.startTime).getTime() -
            toDate(b.date, b.startTime).getTime()
        ),
    [todays]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return todaysUpcoming;
    return todaysUpcoming.filter((a) =>
      (a.fullName || "").toLowerCase().includes(s)
    );
  }, [todaysUpcoming, q]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: "8px",
            }}
          >
            Bekleyen Kullanıcılar
          </h1>
          <p style={{ color: "#64748b" }}>
            Yalnızca <strong>bugünkü</strong> ve <strong>yaklaşan</strong>{" "}
            randevular listelenir.
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            marginBottom: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                className="form-control"
                placeholder="Kullanıcı adına göre ara..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ maxWidth: 360 }}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={() => setQ("")}
                disabled={!q}
              >
                Temizle
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#64748b", marginRight: 8 }}>
                Bugün: {todayLocalStr}
              </div>
              <button
                className="btn btn-outline-primary"
                onClick={() => load()}
                disabled={loading}
                title="Yenile"
              >
                Yenile
              </button>
              <button
                className={`btn ${
                  autoRefresh ? "btn-outline-danger" : "btn-outline-success"
                }`}
                onClick={() => setAutoRefresh((v) => !v)}
                title={
                  autoRefresh
                    ? "Otomatik yenilemeyi durdur"
                    : "Otomatik yenilemeyi başlat"
                }
              >
                {autoRefresh ? "Durdur" : "Başlat"}
              </button>
            </div>
          </div>

          <div style={{ padding: "16px" }}>
            {loading && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                Yükleniyor...
              </div>
            )}
            {error && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 16px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  color: "#991b1b",
                  fontSize: "14px",
                }}
              >
                {error}
              </div>
            )}

            {!loading && filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                {(q && "Arama sonucuna uygun bekleyen kullanıcı yok.") ||
                  "Bugün için yaklaşan check-in yok."}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="table table-sm" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Onay Zamanı</th>
                      <th>Randevu Tarihi</th>
                      <th>Saat</th>
                      <th>Kullanıcı</th>
                      <th>Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => (
                      <tr key={a.id}>
                        <td>{formatDateTime(a.checkedInAt)}</td>
                        <td>{formatDate(a.date)}</td>
                        <td>
                          {formatTime(a.startTime)} – {formatTime(a.endTime)}
                        </td>
                        <td>{a.fullName || "-"}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: "#dcfce7",
                              color: "#166534",
                            }}
                          >
                            Check-in
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div
              style={{
                marginTop: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#64748b",
                fontSize: 13,
              }}
            >
              <div>
                {lastUpdated
                  ? `Son güncelleme: ${lastUpdated.toLocaleTimeString("tr-TR")}`
                  : ""}
              </div>
              <div>
                Otomatik yenileme {autoRefresh ? "açık (10 sn)" : "kapalı"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
