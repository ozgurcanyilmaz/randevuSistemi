import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Appt = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  branchName: string;
  providerId: number;
};

type Tab = "upcoming" | "past" | "all";

export default function UserAppointments() {
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Appt[]>("/user/appointments");
      setItems(data);
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

  const dataForTab =
    activeTab === "upcoming" ? upcoming : activeTab === "past" ? past : sorted;

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
            Randevularım
          </h1>
          <p style={{ color: "#64748b" }}>
            Yaklaşan randevuları takip edin, geçmiş ziyaretlerinizi
            görüntüleyin.
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

          {!loading && dataForTab.length === 0 ? (
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
              {activeTab === "upcoming"
                ? "Yaklaşan randevunuz bulunmuyor."
                : activeTab === "past"
                ? "Geçmiş randevu kaydı bulunmuyor."
                : "Herhangi bir randevu bulunamadı."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table table-sm" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th style={{ whiteSpace: "nowrap" }}>Tarih</th>
                    <th style={{ whiteSpace: "nowrap" }}>Saat</th>
                    <th style={{ whiteSpace: "nowrap" }}>Şube</th>
                    <th style={{ whiteSpace: "nowrap" }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {dataForTab.map((a) => {
                    const isPast = toDate(a).getTime() < now.getTime();
                    return (
                      <tr key={a.id}>
                        <td>{formatDate(a.date)}</td>
                        <td>
                          {formatTime(a.startTime)} – {formatTime(a.endTime)}
                        </td>
                        <td>{a.branchName}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 600,
                              background: isPast ? "#e5e7eb" : "#dcfce7",
                              color: isPast ? "#374151" : "#166534",
                            }}
                          >
                            {isPast ? "Geçti" : "Yaklaşan"}
                          </span>
                        </td>
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
        >
          Randevunuzun saatinde şubede hazır bulunmayı unutmayın.
          Değişiklik/iptal için şube ile iletişime geçebilirsiniz.
        </div>
      </div>
    </div>
  );
}
