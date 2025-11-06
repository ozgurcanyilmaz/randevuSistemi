import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

type Appt = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  branchName: string;
  providerId: number;
  providerNotes?: string;
};

type SessionDetail = {
  id: number;
  appointmentId: number;
  summary: string;
  notes?: string;
  outcome?: string;
  actionItems?: string;
  nextSessionDate?: string;
  nextSessionNotes?: string;
  completedAt?: string;
  provider: {
    name: string;
    branchName: string;
  };
  appointment: {
    id: number;
    date: string;
    startTime: string;
    endTime: string;
  };
};

type Tab = "upcoming" | "past" | "all";

export default function UserAppointments() {
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");

  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(
    null
  );
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [appointmentSessions, setAppointmentSessions] = useState<
    Record<number, number>
  >({});

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appt | null>(
    null
  );
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [apptsRes, sessionsRes] = await Promise.all([
        api.get<Appt[]>("/user/appointments"),
        api.get<SessionDetail[]>("/user/sessions"),
      ]);

      setItems(apptsRes.data);

      const sessionMap: Record<number, number> = {};
      sessionsRes.data.forEach((s: any) => {
        if (s.appointmentId) {
          sessionMap[s.appointmentId] = s.id;
        }
      });
      setAppointmentSessions(sessionMap);
    } catch {
      setError("Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSessionForAppointment(appointmentId: number) {
    setLoadingSession(true);
    setError(null);
    try {
      const sessionId = appointmentSessions[appointmentId];
      if (!sessionId) {
        setError("Bu randevu için henüz tamamlanmış görüşme bulunamadı.");
        setLoadingSession(false);
        return;
      }

      const { data } = await api.get<SessionDetail>(
        `/user/sessions/${sessionId}`
      );
      setSelectedSession(data);
      setShowSessionModal(true);
    } catch {
      setError("Görüşme detayı yüklenemedi.");
    } finally {
      setLoadingSession(false);
    }
  }

  async function cancelAppointment() {
    if (!appointmentToCancel) return;
    setCancelling(true);
    setError(null);

    try {
      await api.delete(`/user/appointments/${appointmentToCancel.id}`);
      setShowCancelModal(false);
      setAppointmentToCancel(null);
      setCancelSuccess("Randevunuz başarıyla iptal edildi.");
      setTimeout(() => setCancelSuccess(null), 3000);
      await load();
    } catch (e: any) {
      setError(e?.response?.data || "Randevu iptal edilemedi.");
      setShowCancelModal(false);
      setAppointmentToCancel(null);
    } finally {
      setCancelling(false);
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

  const formatDateTime = (s?: string) =>
    s
      ? new Date(s).toLocaleString("tr-TR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const now = new Date();
  const sorted = useMemo(
    () => [...items].sort((a, b) => toDate(a).getTime() - toDate(b).getTime()),
    [items]
  );

  const upcoming = useMemo(
    () => sorted.filter((a) => toDate(a).getTime() >= now.getTime()),
    [sorted, now]
  );

  const past = useMemo(
    () => sorted.filter((a) => toDate(a).getTime() < now.getTime()),
    [sorted, now]
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
            Yaklaşan randevuları takip edin, geçmiş görüşme raporlarınızı
            görüntüleyin.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        {cancelSuccess && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              color: "#166534",
            }}
          >
            {cancelSuccess}
          </div>
        )}

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
                            ⏰ {formatTime(a.startTime)} –{" "}
                            {formatTime(a.endTime)}
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

                    {isPast && appointmentSessions[a.id] && (
                      <div style={{ marginTop: 12 }}>
                        <button
                          style={{
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            fontWeight: 500,
                            padding: "8px 16px",
                            border: "1px solid #bfdbfe",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                            transition: "all 0.2s",
                          }}
                          onClick={() => loadSessionForAppointment(a.id)}
                          disabled={loadingSession}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#dbeafe";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#eff6ff";
                          }}
                        >
                          {loadingSession
                            ? "Yükleniyor..."
                            : "📄 Görüşme Raporunu Gör"}
                        </button>
                      </div>
                    )}

                    {!isPast && (
                      <div style={{ marginTop: 12 }}>
                        <button
                          style={{
                            background: "#fef2f2",
                            color: "#dc2626",
                            fontWeight: 500,
                            padding: "8px 16px",
                            border: "1px solid #fecaca",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                            transition: "all 0.2s",
                          }}
                          onClick={() => {
                            setAppointmentToCancel(a);
                            setShowCancelModal(true);
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#fee2e2";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#fef2f2";
                          }}
                        >
                          ❌ Randevuyu İptal Et
                        </button>
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
          💡 <strong>Hatırlatma:</strong> Randevunuzun saatinde şubede hazır
          bulunmayı unutmayın. Geçmiş randevularınızın görüşme raporlarını
          görüntüleyebilirsiniz.
        </div>

        {/* Session Detail Modal */}
        {showSessionModal && selectedSession && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 24,
            }}
            onClick={() => setShowSessionModal(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 32,
                maxWidth: 700,
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ marginBottom: 24 }}>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: 8,
                  }}
                >
                  📋 Görüşme Raporu
                </h2>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  👤 {selectedSession.provider.name} • 🏪{" "}
                  {selectedSession.provider.branchName}
                </div>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  📅 {formatDate(selectedSession.appointment.date)} • ⏰{" "}
                  {selectedSession.appointment.startTime}
                </div>
                {selectedSession.completedAt && (
                  <div style={{ fontSize: 13, color: "#16a34a", marginTop: 4 }}>
                    ✓ Tamamlanma: {formatDateTime(selectedSession.completedAt)}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gap: 20 }}>
                {selectedSession.summary && (
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      📝 Görüşme Özeti
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "#0f172a",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedSession.summary}
                    </div>
                  </div>
                )}

                {selectedSession.notes && (
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      💭 Notlar
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "#0f172a",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedSession.notes}
                    </div>
                  </div>
                )}

                {selectedSession.outcome && (
                  <div
                    style={{
                      background: "#eff6ff",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1e40af",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      🎯 Sonuç / Değerlendirme
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "#1e40af",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedSession.outcome}
                    </div>
                  </div>
                )}

                {selectedSession.actionItems && (
                  <div
                    style={{
                      background: "#fef3c7",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #fcd34d",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#92400e",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      ✅ Aksiyon Maddeleri
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: "#92400e",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedSession.actionItems}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 24, textAlign: "right" }}>
                <button
                  style={{
                    background: "#2563eb",
                    color: "white",
                    fontWeight: 500,
                    padding: "10px 24px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  onClick={() => setShowSessionModal(false)}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {showCancelModal && appointmentToCancel && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 24,
            }}
            onClick={() => !cancelling && setShowCancelModal(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 32,
                maxWidth: 500,
                width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "#fef2f2",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    fontSize: 32,
                  }}
                >
                  ⚠️
                </div>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: 8,
                  }}
                >
                  Randevu İptali
                </h2>
                <p style={{ color: "#64748b", fontSize: 14 }}>
                  Bu randevuyu iptal etmek istediğinizden emin misiniz?
                </p>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{ fontSize: 14, color: "#334155", marginBottom: 12 }}
                >
                  <strong>İptal edilecek randevu:</strong>
                </div>
                <div
                  style={{ fontSize: 14, color: "#64748b", lineHeight: 1.8 }}
                >
                  <div>🏪 {appointmentToCancel.branchName}</div>
                  <div>📅 {formatDate(appointmentToCancel.date)}</div>
                  <div>
                    ⏰ {formatTime(appointmentToCancel.startTime)} –{" "}
                    {formatTime(appointmentToCancel.endTime)}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#fef3c7",
                  border: "1px solid #fcd34d",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                  fontSize: 13,
                  color: "#92400e",
                  lineHeight: 1.5,
                }}
              >
                ⚠️ <strong>Uyarı:</strong> İptal edilen randevu geri alınamaz.
                İptal sonrasında aynı saati tekrar seçebilirsiniz.
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  style={{
                    flex: 1,
                    background: "transparent",
                    color: "#64748b",
                    fontWeight: 500,
                    padding: "12px 24px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 15,
                    transition: "all 0.2s",
                  }}
                  onClick={() => !cancelling && setShowCancelModal(false)}
                  disabled={cancelling}
                  onMouseOver={(e) => {
                    if (!cancelling)
                      e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Vazgeç
                </button>
                <button
                  style={{
                    flex: 1,
                    background: cancelling ? "#94a3b8" : "#dc2626",
                    color: "white",
                    fontWeight: 600,
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: 8,
                    cursor: cancelling ? "not-allowed" : "pointer",
                    fontSize: 15,
                    transition: "all 0.2s",
                  }}
                  onClick={cancelAppointment}
                  disabled={cancelling}
                  onMouseOver={(e) => {
                    if (!cancelling)
                      e.currentTarget.style.background = "#b91c1c";
                  }}
                  onMouseOut={(e) => {
                    if (!cancelling)
                      e.currentTarget.style.background = "#dc2626";
                  }}
                >
                  {cancelling ? "İptal Ediliyor..." : "✓ Evet, İptal Et"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
