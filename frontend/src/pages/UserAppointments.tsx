import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Appt = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  branchName: string;
  providerId: number;
  providerNotes?: string;
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
            Yaklaşan randevuları takip edin, geçmiş ziyaretlerinizi ve ilgili notlarını görüntüleyin.
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
            <div style={{ display: "grid", gap: 16 }}>
              {dataForTab.map((a) => {
                const isPast = toDate(a).getTime() < now.getTime();
                return (
                  <div
                    key={a.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 20,
                      background: "#f8fafc",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#1e293b",
                            marginBottom: 8,
                          }}
                        >
                          🏪 {a.branchName}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#64748b",
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                          }}
                        >
                          <span>📅 {formatDate(a.date)}</span>
                          <span>
                            ⏰ {formatTime(a.startTime)} – {formatTime(a.endTime)}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "6px 14px",
                          borderRadius: "9999px",
                          fontSize: "13px",
                          fontWeight: 600,
                          background: isPast ? "#e5e7eb" : "#dcfce7",
                          color: isPast ? "#374151" : "#166534",
                        }}
                      >
                        {isPast ? "📋 Geçti" : "⏳ Yaklaşan"}
                      </span>
                    </div>

                    {a.providerNotes && (
                      <div
                        style={{
                          background: "#dcfce7",
                          border: "1px solid #bbf7d0",
                          borderRadius: 8,
                          padding: 14,
                          marginTop: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#166534",
                            marginBottom: 6,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          💬 İlgili Notu
                        </div>
                        <div style={{ fontSize: 14, color: "#166534" }}>
                          {a.providerNotes}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          💡 <strong>Hatırlatma:</strong> Randevunuzun saatinde şubede hazır bulunmayı unutmayın.
          Değişiklik/iptal için şube ile iletişime geçebilirsiniz.
        </div>
      </div>
    </div>
  );
}