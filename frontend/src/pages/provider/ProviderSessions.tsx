import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

type Session = {
  id: number;
  appointmentId: number;
  summary: string;
  notes?: string;
  outcome?: string;
  actionItems?: string;
  nextSessionDate?: string;
  nextSessionNotes?: string;
  providerPrivateNotes?: string;
  startedAt: string;
  completedAt?: string;
  status: number;
  userName: string;
  appointmentDate: string;
  appointmentTime: string;
};

type SessionDetailResponse = {
  id: number;
  appointmentId: number;
  summary: string;
  notes?: string;
  outcome?: string;
  actionItems?: string;
  nextSessionDate?: string;
  nextSessionNotes?: string;
  providerPrivateNotes?: string;
  startedAt: string;
  completedAt?: string;
  status: number;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
  };
  appointment: {
    date: string;
    startTime: string;
    endTime: string;
  };
};

type Tab = "all" | "inProgress" | "completed";

export default function ProviderSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [q, setQ] = useState("");

  const [selectedSession, setSelectedSession] =
    useState<SessionDetailResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [editingSummary, setEditingSummary] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  const [editingOutcome, setEditingOutcome] = useState("");
  const [editingActionItems, setEditingActionItems] = useState("");
  const [editingNextDate, setEditingNextDate] = useState("");
  const [editingNextNotes, setEditingNextNotes] = useState("");
  const [editingPrivateNotes, setEditingPrivateNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Session[]>("/provider/sessions");
      setSessions(data || []);
    } catch {
      setError("Görüşmeler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
    return dStr;
  };

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

  const getStatusText = (status: number) => {
    switch (status) {
      case 0:
        return "Devam Ediyor";
      case 1:
        return "Tamamlandı";
      case 2:
        return "İptal Edildi";
      default:
        return "Bilinmiyor";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return { bg: "#fef3c7", fg: "#92400e" };
      case 1:
        return { bg: "#dbeafe", fg: "#1e40af" };
      case 2:
        return { bg: "#fee2e2", fg: "#991b1b" };
      default:
        return { bg: "#e5e7eb", fg: "#374151" };
    }
  };

  const inProgress = useMemo(
    () => sessions.filter((s) => s.status === 0),
    [sessions]
  );

  const completed = useMemo(
    () => sessions.filter((s) => s.status === 1),
    [sessions]
  );

  const dataForTab =
    activeTab === "inProgress"
      ? inProgress
      : activeTab === "completed"
      ? completed
      : sessions;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return dataForTab;
    return dataForTab.filter(
      (sess) =>
        sess.userName.toLowerCase().includes(s) ||
        sess.summary.toLowerCase().includes(s)
    );
  }, [dataForTab, q]);

  async function loadSessionDetail(id: number) {
    setLoadingDetail(true);
    setError(null);
    try {
      const { data } = await api.get<SessionDetailResponse>(
        `/provider/sessions/${id}`
      );
      setSelectedSession(data);
      setEditingSummary(data.summary);
      setEditingNotes(data.notes || "");
      setEditingOutcome(data.outcome || "");
      setEditingActionItems(data.actionItems || "");
      setEditingNextDate(data.nextSessionDate || "");
      setEditingNextNotes(data.nextSessionNotes || "");
      setEditingPrivateNotes(data.providerPrivateNotes || "");
      setShowDetailModal(true);
    } catch {
      setError("Görüşme detayı yüklenemedi.");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function updateSession() {
    if (!selectedSession) return;
    setUpdating(true);
    setError(null);
    try {
      await api.put(`/provider/sessions/${selectedSession.id}`, {
        summary: editingSummary,
        notes: editingNotes,
        outcome: editingOutcome,
        actionItems: editingActionItems,
        nextSessionDate: editingNextDate || null,
        nextSessionNotes: editingNextNotes,
        providerPrivateNotes: editingPrivateNotes,
      });
      setSuccess("Görüşme güncellendi!");
      setTimeout(() => setSuccess(null), 3000);
      await load();
      setShowDetailModal(false);
      setSelectedSession(null);
    } catch {
      setError("Görüşme güncellenemedi.");
    } finally {
      setUpdating(false);
    }
  }

  async function completeSession() {
    if (!selectedSession) return;
    setCompleting(true);
    setError(null);
    try {
      await api.post(`/provider/sessions/${selectedSession.id}/complete`, {
        summary: editingSummary,
        notes: editingNotes,
        outcome: editingOutcome,
        actionItems: editingActionItems,
        nextSessionDate: editingNextDate || null,
        nextSessionNotes: editingNextNotes,
        providerPrivateNotes: editingPrivateNotes,
      });
      setSuccess("Görüşme tamamlandı!");
      setTimeout(() => setSuccess(null), 3000);
      await load();
      setShowCompleteModal(false);
      setShowDetailModal(false);
      setSelectedSession(null);
    } catch {
      setError("Görüşme tamamlanamadı.");
    } finally {
      setCompleting(false);
    }
  }

  async function cancelSession() {
    if (!selectedSession) return;
    if (!confirm("Bu görüşmeyi iptal etmek istediğinizden emin misiniz?"))
      return;

    setError(null);
    try {
      await api.post(`/provider/sessions/${selectedSession.id}/cancel`);
      setSuccess("Görüşme iptal edildi!");
      setTimeout(() => setSuccess(null), 3000);
      await load();
      setShowDetailModal(false);
      setSelectedSession(null);
    } catch {
      setError("Görüşme iptal edilemedi.");
    }
  }

  const todayStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

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
            Görüşmeler
          </h1>
          <p style={{ color: "#64748b" }}>
            Tüm görüşmelerinizi görüntüleyin, güncelleyin ve tamamlayın.
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

        {success && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              color: "#166534",
            }}
          >
            {success}
          </div>
        )}

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
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
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
              📁 Tümü ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab("inProgress")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "inProgress" ? "#eff6ff" : "transparent",
                color: activeTab === "inProgress" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "inProgress" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              🔄 Devam Ediyor ({inProgress.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "completed" ? "#eff6ff" : "transparent",
                color: activeTab === "completed" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "completed" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              ✓ Tamamlandı ({completed.length})
            </button>
          </div>

          <div
            style={{
              padding: "16px",
              display: "flex",
              gap: 12,
              alignItems: "center",
              background: "#f8fafc",
            }}
          >
            <input
              className="form-control"
              placeholder="Kullanıcı veya özete göre ara..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ maxWidth: 360 }}
            />
            <button
              style={{
                background: "transparent",
                color: "#64748b",
                fontWeight: 500,
                padding: "8px 16px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                opacity: !q ? 0.5 : 1,
              }}
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
                marginBottom: 16,
                padding: "12px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#64748b",
              }}
            >
              Yükleniyor...
            </div>
          )}

          {!loading && filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "#94a3b8",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px dashed #cbd5e1",
              }}
            >
              {q
                ? "Arama sonucuna uygun görüşme bulunamadı."
                : activeTab === "inProgress"
                ? "Devam eden görüşme bulunmuyor."
                : activeTab === "completed"
                ? "Tamamlanmış görüşme bulunmuyor."
                : "Henüz görüşme bulunmuyor."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {filtered.map((sess) => {
                const statusColor = getStatusColor(sess.status);
                return (
                  <div
                    key={sess.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 20,
                      background: "#f8fafc",
                      transition: "all 0.2s",
                      cursor: "pointer",
                    }}
                    onClick={() => loadSessionDetail(sess.id)}
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
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#1e293b",
                            marginBottom: 4,
                          }}
                        >
                          👤 {sess.userName}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#64748b",
                            marginBottom: 8,
                          }}
                        >
                          📅 {formatDate(sess.appointmentDate)} • ⏰{" "}
                          {sess.appointmentTime}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#334155",
                            lineHeight: 1.5,
                          }}
                        >
                          <strong>Özet:</strong> {sess.summary}
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
                          background: statusColor.bg,
                          color: statusColor.fg,
                          whiteSpace: "nowrap",
                          marginLeft: 16,
                        }}
                      >
                        {getStatusText(sess.status)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 13,
                        color: "#64748b",
                      }}
                    >
                      <span>
                        🕐 Başlangıç: {formatDateTime(sess.startedAt)}
                      </span>
                      {sess.completedAt && (
                        <span>
                          ✓ Tamamlanma: {formatDateTime(sess.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showDetailModal && selectedSession && (
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
            onClick={() =>
              !updating && !completing && setShowDetailModal(false)
            }
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 32,
                maxWidth: 800,
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 24,
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color: "#1e293b",
                      marginBottom: 8,
                    }}
                  >
                    Görüşme Detayı
                  </h2>
                  <div style={{ fontSize: 14, color: "#64748b" }}>
                    👤 {selectedSession.user.name} • 📅{" "}
                    {formatDate(selectedSession.appointment.date)} • ⏰{" "}
                    {selectedSession.appointment.startTime}
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
                    ...getStatusColor(selectedSession.status),
                    background: getStatusColor(selectedSession.status).bg,
                    color: getStatusColor(selectedSession.status).fg,
                  }}
                >
                  {getStatusText(selectedSession.status)}
                </span>
              </div>

              {selectedSession.status === 1 && (
                <div
                  style={{
                    marginBottom: 24,
                    padding: "12px 16px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 8,
                    color: "#1e40af",
                    fontSize: 14,
                  }}
                >
                  ℹ️ Bu görüşme tamamlanmıştır. Bilgileri görüntüleyebilirsiniz.
                </div>
              )}

              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: 8,
                    }}
                  >
                    Görüşme Özeti *
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={editingSummary}
                    onChange={(e) => setEditingSummary(e.target.value)}
                    disabled={selectedSession.status === 1}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: 8,
                    }}
                  >
                    Notlar
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Görüşme notları..."
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    disabled={selectedSession.status === 1}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: 8,
                    }}
                  >
                    Sonuç/Değerlendirme
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Görüşme sonucu..."
                    value={editingOutcome}
                    onChange={(e) => setEditingOutcome(e.target.value)}
                    disabled={selectedSession.status === 1}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: 8,
                    }}
                  >
                    Aksiyon Maddeleri
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Sonraki adımlar, ödevler..."
                    value={editingActionItems}
                    onChange={(e) => setEditingActionItems(e.target.value)}
                    disabled={selectedSession.status === 1}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: 8,
                    }}
                  >
                    🔒 Özel Notlar (Sadece sizin görebileceğiniz)
                  </label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Kullanıcının göremeyeceği özel notlarınız..."
                    value={editingPrivateNotes}
                    onChange={(e) => setEditingPrivateNotes(e.target.value)}
                    disabled={selectedSession.status === 1}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 24,
                  justifyContent: "flex-end",
                }}
              >
                {selectedSession.status === 0 && (
                  <>
                    <button
                      style={{
                        background: "transparent",
                        color: "#dc2626",
                        fontWeight: 500,
                        padding: "10px 20px",
                        border: "1px solid #fecaca",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                      onClick={cancelSession}
                    >
                      ❌ İptal Et
                    </button>
                    <button
                      style={{
                        background: "transparent",
                        color: "#64748b",
                        fontWeight: 500,
                        padding: "10px 20px",
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                      onClick={updateSession}
                      disabled={updating}
                    >
                      {updating ? "Kaydediliyor..." : "💾 Kaydet"}
                    </button>
                    <button
                      style={{
                        background: "#16a34a",
                        color: "white",
                        fontWeight: 500,
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                      onClick={() => setShowCompleteModal(true)}
                    >
                      ✓ Görüşmeyi Tamamla
                    </button>
                  </>
                )}
                {selectedSession.status === 1 && (
                  <button
                    style={{
                      background: "transparent",
                      color: "#64748b",
                      fontWeight: 500,
                      padding: "10px 20px",
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                    onClick={() => setShowDetailModal(false)}
                  >
                    Kapat
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showCompleteModal && selectedSession && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => !completing && setShowCompleteModal(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 32,
                maxWidth: 500,
                width: "90%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 16,
                }}
              >
                Görüşmeyi Tamamla
              </h2>
              <p
                style={{ color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}
              >
                Bu görüşmeyi tamamlamak istediğinizden emin misiniz?
                Tamamlandıktan sonra görüşme bilgileri düzenlenemez.
              </p>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  style={{
                    background: "transparent",
                    color: "#64748b",
                    fontWeight: 500,
                    padding: "10px 20px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  onClick={() => !completing && setShowCompleteModal(false)}
                  disabled={completing}
                >
                  İptal
                </button>
                <button
                  style={{
                    background: "#16a34a",
                    color: "white",
                    fontWeight: 500,
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: 8,
                    cursor: completing ? "not-allowed" : "pointer",
                    fontSize: 14,
                  }}
                  onClick={completeSession}
                  disabled={completing}
                >
                  {completing ? "Tamamlanıyor..." : "✓ Evet, Tamamla"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
