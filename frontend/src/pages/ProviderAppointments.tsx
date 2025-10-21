import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Appt = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  userId?: string;
  fullName?: string;
  checkedInAt?: string;
};

type Tab = "upcoming" | "past" | "all";

export default function ProviderAppointments() {
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Appt[]>("/provider/appointments");
      setItems(data || []);
    } catch {
      setError("Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toDate = (a: Appt) => {
    const dt = `${a.date}T${a.startTime}`;
    const d = new Date(dt);
    return isNaN(d.getTime()) ? new Date(a.date) : d;
  };
  const formatDate = (dStr: string) => {
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    const [y, m, dd] = dStr.split("-");
    if (y && m && dd) return `${dd}.${m}.${y}`;
    return dStr;
  };
  const formatTime = (t: string) => t;
  const formatCheckin = (val?: string) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return `${d.toLocaleDateString("tr-TR")} ${d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const now = new Date();
  const sorted = useMemo(
    () => [...items].sort((a, b) => toDate(a).getTime() - toDate(b).getTime()),
    [items]
  );
  const upcoming = useMemo(
    () => sorted.filter((a) => toDate(a).getTime() >= now.getTime()),
    [sorted]
  );
  const past = useMemo(
    () => sorted.filter((a) => toDate(a).getTime() < now.getTime()),
    [sorted]
  );

  const tabData =
    activeTab === "upcoming" ? upcoming : activeTab === "past" ? past : sorted;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tabData;
    return tabData.filter((a) => (a.fullName || "").toLowerCase().includes(s));
  }, [tabData, q]);

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
            Randevularım (İlgili)
          </h1>
          <p style={{ color: "#64748b" }}>
            Yaklaşan randevuları yönetin, geçmiş randevularınızı görüntüleyin.
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            marginBottom: "24px",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
            <button
              onClick={() => setActiveTab("upcoming")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "upcoming" ? "#eff6ff" : "transparent",
                color: activeTab === "upcoming" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "upcoming" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              ⏳ Yaklaşan ({upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "past" ? "#eff6ff" : "transparent",
                color: activeTab === "past" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "past" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              📜 Geçmiş ({past.length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "all" ? "#eff6ff" : "transparent",
                color: activeTab === "all" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "all" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              📁 Tümü ({sorted.length})
            </button>
          </div>

          <div style={{ padding: "12px 16px", display: "flex", gap: 12 }}>
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
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            padding: "24px",
          }}
        >
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
              {(q && "Arama sonucuna uygun randevu bulunamadı.") ||
                (activeTab === "upcoming"
                  ? "Yaklaşan randevu bulunmuyor."
                  : activeTab === "past"
                  ? "Geçmiş randevu kaydı bulunmuyor."
                  : "Herhangi bir randevu bulunamadı.")}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table table-sm" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Saat</th>
                    <th>Kullanıcı</th>
                    <th>Durum</th>
                    <th>Onay Zamanı</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const isPast = toDate(a).getTime() < now.getTime();
                    const checked = !!a.checkedInAt;
                    return (
                      <tr key={a.id}>
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
                              background: checked
                                ? "#dcfce7"
                                : isPast
                                ? "#e5e7eb"
                                : "#fee2e2",
                              color: checked
                                ? "#166534"
                                : isPast
                                ? "#374151"
                                : "#991b1b",
                            }}
                          >
                            {checked
                              ? "Check-in"
                              : isPast
                              ? "Geçti"
                              : "Bekliyor"}
                          </span>
                        </td>
                        <td>{checked ? formatCheckin(a.checkedInAt) : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: 14,
          }}
        ></div>
      </div>
    </div>
  );
}
