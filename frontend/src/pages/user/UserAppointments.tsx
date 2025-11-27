import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Alert,
  Button,
  Badge,
  Loading,
  EmptyState,
  Modal,
  Tabs,
} from "../../components/common";
import { colors } from "../../styles/commonStyles";
import { formatDate, formatTime, formatDateTime } from "../../utils/formatters";

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

  const tabs = [
    { id: "upcoming", label: `⏳ Yaklaşan (${upcoming.length})` },
    { id: "past", label: `📜 Geçmiş (${past.length})` },
    { id: "all", label: `📁 Tümü (${sorted.length})` },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Randevularım"
        subtitle="Yaklaşan randevuları takip edin, geçmiş görüşme raporlarınızı görüntüleyin."
      />

      {error && <Alert type="error" message={error} />}
      {cancelSuccess && <Alert type="success" message={cancelSuccess} />}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
      />

      <Card>
        {loading && <Loading message="Yükleniyor..." />}

        {!loading && dataForTab.length === 0 ? (
          <EmptyState
            message={
              activeTab === "upcoming"
                ? "Yaklaşan randevunuz bulunmuyor."
                : activeTab === "past"
                ? "Geçmiş randevu kaydı bulunmuyor."
                : "Herhangi bir randevu bulunamadı."
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gap: "16px",
              maxHeight: "70vh",
              overflowY: "auto",
              paddingRight: "8px",
            }}
          >
            {dataForTab.map((a) => {
              const isPast = toDate(a).getTime() < now.getTime();
              return (
                <Card
                  key={a.id}
                  style={{
                    background: colors.gray[50],
                    border: `1px solid ${colors.gray[200]}`,
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div
                        style={{
                          fontSize: "clamp(16px, 3vw, 18px)",
                          fontWeight: 600,
                          color: colors.gray[900],
                          marginBottom: "8px",
                          wordBreak: "break-word",
                        }}
                      >
                        🏪 {a.branchName}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(12px, 2vw, 14px)",
                          color: colors.gray[500],
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>📅 {formatDate(a.date)}</span>
                        <span>
                          ⏰ {formatTime(a.startTime)} – {formatTime(a.endTime)}
                        </span>
                      </div>
                    </div>
                    <Badge variant={isPast ? "gray" : "success"}>
                      {isPast ? "📋 Geçti" : "⏳ Yaklaşan"}
                    </Badge>
                  </div>

                  {a.providerNotes && (
                    <div
                      style={{
                        background: colors.success[50],
                        border: `1px solid ${colors.success[200]}`,
                        borderRadius: "8px",
                        padding: "14px",
                        marginTop: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "clamp(11px, 1.5vw, 12px)",
                          fontWeight: 600,
                          color: colors.success[800],
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        💬 İlgili Notu
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(12px, 2vw, 14px)",
                          color: colors.success[800],
                          wordBreak: "break-word",
                        }}
                      >
                        {a.providerNotes}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {isPast && appointmentSessions[a.id] && (
                      <Button
                        variant="secondary"
                        onClick={() => loadSessionForAppointment(a.id)}
                        disabled={loadingSession}
                        style={{ fontSize: "clamp(11px, 1.5vw, 13px)" }}
                      >
                        {loadingSession ? "Yükleniyor..." : "📄 Görüşme Raporunu Gör"}
                      </Button>
                    )}

                    {!isPast && (
                      <Button
                        variant="danger"
                        onClick={() => {
                          setAppointmentToCancel(a);
                          setShowCancelModal(true);
                        }}
                        style={{ fontSize: "clamp(11px, 1.5vw, 13px)" }}
                      >
                        ❌ Randevuyu İptal Et
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <div
        style={{
          marginTop: "16px",
          background: colors.primary[50],
          border: `1px solid ${colors.primary[200]}`,
          color: colors.primary[800],
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "clamp(12px, 2vw, 14px)",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        💡 <strong>Hatırlatma:</strong> Randevunuzun saatinde şubede hazır
        bulunmayı unutmayın. Geçmiş randevularınızın görüşme raporlarını
        görüntüleyebilirsiniz.
      </div>

      <Modal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        title="📋 Görüşme Raporu"
        maxWidth="700px"
      >
        {selectedSession && (
          <>
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: colors.gray[500],
                  marginBottom: "4px",
                }}
              >
                👤 {selectedSession.provider.name} • 🏪{" "}
                {selectedSession.provider.branchName}
              </div>
              <div
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: colors.gray[500],
                  marginBottom: "4px",
                }}
              >
                📅 {formatDate(selectedSession.appointment.date)} • ⏰{" "}
                {selectedSession.appointment.startTime}
              </div>
              {selectedSession.completedAt && (
                <div
                  style={{
                    fontSize: "clamp(11px, 1.5vw, 13px)",
                    color: colors.success[600],
                    marginTop: "4px",
                  }}
                >
                  ✓ Tamamlanma: {formatDateTime(selectedSession.completedAt)}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              {selectedSession.summary && (
                <div
                  style={{
                    background: colors.gray[50],
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.gray[200]}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(11px, 1.5vw, 13px)",
                      fontWeight: 600,
                      color: colors.gray[500],
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    📝 Görüşme Özeti
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(13px, 2vw, 15px)",
                      color: colors.gray[900],
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedSession.summary}
                  </div>
                </div>
              )}

              {selectedSession.notes && (
                <div
                  style={{
                    background: colors.gray[50],
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.gray[200]}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(11px, 1.5vw, 13px)",
                      fontWeight: 600,
                      color: colors.gray[500],
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    💭 Notlar
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(13px, 2vw, 15px)",
                      color: colors.gray[900],
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedSession.notes}
                  </div>
                </div>
              )}

              {selectedSession.outcome && (
                <div
                  style={{
                    background: colors.primary[50],
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.primary[200]}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(11px, 1.5vw, 13px)",
                      fontWeight: 600,
                      color: colors.primary[800],
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    🎯 Sonuç / Değerlendirme
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(13px, 2vw, 15px)",
                      color: colors.primary[800],
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedSession.outcome}
                  </div>
                </div>
              )}

              {selectedSession.actionItems && (
                <div
                  style={{
                    background: colors.warning[50],
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${colors.warning[300]}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "clamp(11px, 1.5vw, 13px)",
                      fontWeight: 600,
                      color: colors.warning[800],
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    ✅ Aksiyon Maddeleri
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(13px, 2vw, 15px)",
                      color: colors.warning[800],
                      lineHeight: 1.6,
                      wordBreak: "break-word",
                    }}
                  >
                    {selectedSession.actionItems}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <Button variant="primary" onClick={() => setShowSessionModal(false)}>
                Kapat
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => !cancelling && setShowCancelModal(false)}
        title="Randevu İptali"
      >
        {appointmentToCancel && (
          <>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: colors.error[50],
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "32px",
                }}
              >
                ⚠️
              </div>
              <p
                style={{
                  color: colors.gray[500],
                  fontSize: "clamp(12px, 2vw, 14px)",
                  wordBreak: "break-word",
                }}
              >
                Bu randevuyu iptal etmek istediğinizden emin misiniz?
              </p>
            </div>

            <div
              style={{
                background: colors.gray[50],
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: colors.gray[700],
                  marginBottom: "12px",
                }}
              >
                <strong>İptal edilecek randevu:</strong>
              </div>
              <div
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: colors.gray[500],
                  lineHeight: 1.8,
                  wordBreak: "break-word",
                }}
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
                background: colors.warning[50],
                border: `1px solid ${colors.warning[300]}`,
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "24px",
                fontSize: "clamp(11px, 1.5vw, 13px)",
                color: colors.warning[800],
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              ⚠️ <strong>Uyarı:</strong> İptal edilen randevu geri alınamaz.
              İptal sonrasında aynı saati tekrar seçebilirsiniz.
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Button
                variant="secondary"
                onClick={() => !cancelling && setShowCancelModal(false)}
                disabled={cancelling}
                style={{ flex: 1, minWidth: "120px" }}
              >
                Vazgeç
              </Button>
              <Button
                variant="danger"
                onClick={cancelAppointment}
                disabled={cancelling}
                style={{ flex: 1, minWidth: "120px" }}
              >
                {cancelling ? "İptal Ediliyor..." : "✓ Evet, İptal Et"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </PageContainer>
  );
}
