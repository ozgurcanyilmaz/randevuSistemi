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
  Tabs,
  Input,
  Modal,
  Textarea,
} from "../../components/common";
import { commonStyles, colors } from "../../styles/commonStyles";
import { formatDate, formatTime } from "../../utils/formatters";

type Appt = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  userId?: string;
  fullName?: string;
  checkedInAt?: string;
  notes?: string;
  providerNotes?: string;
  serviceProviderProfileId?: number;
};

type Session = {
  id: number;
  appointmentId: number;
  status: number;
  startedAt: string;
  completedAt?: string;
};

type Slot = { start: string; end: string };
type Tab = "upcoming" | "past" | "all";

export default function ProviderAppointments() {
  const [items, setItems] = useState<Appt[]>([]);
  const [sessions, setSessions] = useState<Record<number, Session>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [selectedAppt, setSelectedAppt] = useState<Appt | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionAppt, setSessionAppt] = useState<Appt | null>(null);
  const [sessionSummary, setSessionSummary] = useState("");
  const [startingSession, setStartingSession] = useState(false);

  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpUser, setFollowUpUser] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpSlots, setFollowUpSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [apptRes, sessionRes] = await Promise.all([
        api.get<Appt[]>("/provider/appointments"),
        api.get<Session[]>("/provider/sessions"),
      ]);

      setItems(apptRes.data || []);

      const sessionMap: Record<number, Session> = {};
      (sessionRes.data || []).forEach((s) => {
        if (s.appointmentId) sessionMap[s.appointmentId] = s;
      });
      setSessions(sessionMap);
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

  const now = new Date();
  const sorted = useMemo(
    () => [...items].sort((a, b) => toDate(b).getTime() - toDate(a).getTime()),
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

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return dataForTab;
    return dataForTab.filter((a) =>
      (a.fullName || "").toLowerCase().includes(s)
    );
  }, [dataForTab, q]);

  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string }>();
    items.forEach((a) => {
      if (a.userId && !userMap.has(a.userId)) {
        userMap.set(a.userId, { id: a.userId, name: a.fullName || a.userId });
      }
    });
    return Array.from(userMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items]);

  async function saveNote() {
    if (!selectedAppt) return;
    setSavingNote(true);
    setError(null);
    try {
      await api.post("/provider/appointments/add-note", {
        appointmentId: selectedAppt.id,
        providerNotes: noteText,
      });
      await load();
      setSelectedAppt(null);
      setNoteText("");
      setSuccess("Not başarıyla kaydedildi!");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Not kaydedilemedi.");
    } finally {
      setSavingNote(false);
    }
  }

  async function startSession() {
    if (!sessionAppt || !sessionSummary.trim()) {
      setError("Lütfen görüşme özeti girin");
      return;
    }

    setStartingSession(true);
    setError(null);

    try {
      await api.post("/provider/sessions/start", {
        appointmentId: sessionAppt.id,
        summary: sessionSummary.trim(),
      });

      setShowSessionModal(false);
      setSessionAppt(null);
      setSessionSummary("");
      setSuccess("Görüşme başarıyla başlatıldı!");
      setTimeout(() => setSuccess(null), 3000);
      await load();
    } catch (e: any) {
      setError(e?.response?.data || "Görüşme başlatılamadı");
    } finally {
      setStartingSession(false);
    }
  }

  async function loadFollowUpSlots() {
    if (!followUpDate || items.length === 0) return;
    setLoadingSlots(true);
    try {
      const providerId = items[0]?.serviceProviderProfileId;
      if (!providerId) {
        setError("Provider ID bulunamadı.");
        setLoadingSlots(false);
        return;
      }

      const { data } = await api.get(`/user/providers/${providerId}/slots`, {
        params: { date: followUpDate },
      });
      setFollowUpSlots(
        data.map((x: any) => ({
          start: x.start || x.Start,
          end: x.end || x.End,
        }))
      );
    } catch (e: any) {
      console.error("Slot loading error:", e);
      setError("Uygun saatler yüklenemedi.");
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (followUpDate) loadFollowUpSlots();
  }, [followUpDate]);

  async function createFollowUp(start: string, end: string) {
    if (!followUpUser || !followUpDate) return;
    setError(null);
    try {
      await api.post("/provider/appointments/create-followup", {
        userId: followUpUser,
        date: followUpDate,
        start,
        end,
        notes: "Takip randevusu",
      });
      setShowFollowUp(false);
      setFollowUpUser("");
      setFollowUpDate("");
      setFollowUpSlots([]);
      await load();
      setSuccess("Takip randevusu başarıyla oluşturuldu!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.response?.data || "Takip randevusu oluşturulamadı.");
    }
  }

  const todayStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  const getSessionForAppointment = (apptId: number) => {
    return sessions[apptId];
  };

  const getSessionStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="warning">🔄 Görüşme Devam Ediyor</Badge>;
      case 1:
        return <Badge variant="primary">📝 Görüşme Tamamlandı</Badge>;
      case 2:
        return <Badge variant="error">❌ İptal Edildi</Badge>;
      default:
        return <Badge variant="gray">❓ Bilinmiyor</Badge>;
    }
  };

  const tabs = [
    { id: "upcoming", label: `⏳ Yaklaşan (${upcoming.length})` },
    { id: "past", label: `📜 Geçmiş (${past.length})` },
    { id: "all", label: `📁 Tümü (${sorted.length})` },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Randevularım"
        subtitle="Randevuları yönetin, not ekleyin, görüşme başlatın ve takip randevusu oluşturun."
      />

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as Tab)}
      />

      <Card style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Input
            placeholder="Kullanıcı adına göre ara..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1, maxWidth: "360px" }}
          />
          <Button variant="secondary" onClick={() => setQ("")} disabled={!q}>
            Temizle
          </Button>
        </div>
      </Card>

      <Card>
        {loading && <Loading message="Yükleniyor..." />}

        {!loading && filtered.length === 0 ? (
          <EmptyState
            message={
              q
                ? "Arama sonucuna uygun randevu bulunamadı."
                : activeTab === "upcoming"
                ? "Yaklaşan randevu bulunmuyor."
                : activeTab === "past"
                ? "Geçmiş randevu kaydı bulunmuyor."
                : "Henüz randevu bulunmuyor."
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
            {filtered.map((a) => {
              const isPast = toDate(a).getTime() < now.getTime();
              const checked = !!a.checkedInAt;
              const session = getSessionForAppointment(a.id);
              const hasSession = !!session;
              const canStartSession = checked && !hasSession;

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
                          marginBottom: "4px",
                          wordBreak: "break-word",
                        }}
                      >
                        👤 {a.fullName || "Kullanıcı"}
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
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                      }}
                    >
                      <Badge
                        variant={
                          checked
                            ? "success"
                            : isPast
                            ? "gray"
                            : "error"
                        }
                      >
                        {checked
                          ? "✓ Check-in"
                          : isPast
                          ? "📋 Geçti"
                          : "⏳ Bekliyor"}
                      </Badge>

                      {hasSession && getSessionStatusBadge(session.status)}
                    </div>
                  </div>

                  {a.notes && (
                    <div
                      style={{
                        background: colors.primary[50],
                        border: `1px solid ${colors.primary[200]}`,
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "clamp(11px, 1.5vw, 12px)",
                          fontWeight: 600,
                          color: colors.primary[800],
                          marginBottom: "4px",
                        }}
                      >
                        📝 Randevu Notu:
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(12px, 2vw, 14px)",
                          color: colors.primary[800],
                          wordBreak: "break-word",
                        }}
                      >
                        {a.notes}
                      </div>
                    </div>
                  )}

                  {a.providerNotes && (
                    <div
                      style={{
                        background: colors.success[50],
                        border: `1px solid ${colors.success[200]}`,
                        borderRadius: "8px",
                        padding: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "clamp(11px, 1.5vw, 12px)",
                          fontWeight: 600,
                          color: colors.success[800],
                          marginBottom: "4px",
                        }}
                      >
                        💬 İlgili Notu:
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
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    {canStartSession && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setSessionAppt(a);
                          setShowSessionModal(true);
                        }}
                        style={{
                          fontSize: "clamp(11px, 1.5vw, 13px)",
                          background: colors.primary[600],
                        }}
                      >
                        🎯 Görüşme Başlat
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedAppt(a);
                        setNoteText(a.providerNotes || "");
                      }}
                      style={{ fontSize: "clamp(11px, 1.5vw, 13px)" }}
                    >
                      {a.providerNotes ? "✏️ Notu Düzenle" : "📝 Not Ekle"}
                    </Button>
                    {a.userId && (
                      <Button
                        variant="success"
                        onClick={() => {
                          setFollowUpUser(a.userId!);
                          setShowFollowUp(true);
                        }}
                        style={{ fontSize: "clamp(11px, 1.5vw, 13px)" }}
                      >
                        ➕ Takip Randevusu
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        isOpen={showSessionModal}
        onClose={() => !startingSession && setShowSessionModal(false)}
        title="🎯 Görüşme Başlat"
      >
        {sessionAppt && (
          <>
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                background: colors.gray[50],
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: colors.gray[500],
                  marginBottom: "4px",
                }}
              >
                👤 Kullanıcı:{" "}
                <strong style={{ color: colors.gray[900] }}>
                  {sessionAppt.fullName}
                </strong>
              </div>
              <div
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: colors.gray[500],
                }}
              >
                📅 Randevu: {formatDate(sessionAppt.date)} -{" "}
                {formatTime(sessionAppt.startTime)}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <Textarea
                label="Görüşme Özeti *"
                rows={3}
                placeholder="Bu görüşmenin kısa bir özetini yazın..."
                value={sessionSummary}
                onChange={(e) => setSessionSummary(e.target.value)}
              />
              <div
                style={{
                  fontSize: "clamp(11px, 1.5vw, 12px)",
                  color: colors.gray[500],
                  marginTop: "4px",
                }}
              >
                Bu özet görüşme başlatıldıktan sonra güncellenebilir
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="secondary"
                onClick={() => {
                  if (!startingSession) {
                    setShowSessionModal(false);
                    setSessionSummary("");
                  }
                }}
                disabled={startingSession}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                onClick={startSession}
                disabled={!sessionSummary.trim() || startingSession}
                style={{
                  background: sessionSummary.trim()
                    ? colors.primary[600]
                    : colors.gray[400],
                }}
              >
                {startingSession ? "Başlatılıyor..." : "🎯 Görüşmeyi Başlat"}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={!!selectedAppt}
        onClose={() => !savingNote && setSelectedAppt(null)}
        title="İlgili Notu"
      >
        {selectedAppt && (
          <>
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                background: colors.gray[50],
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: colors.gray[500],
                  marginBottom: "4px",
                }}
              >
                👤 Kullanıcı:{" "}
                <strong style={{ color: colors.gray[900] }}>
                  {selectedAppt.fullName}
                </strong>
              </div>
              <div
                style={{
                  fontSize: "clamp(12px, 2vw, 14px)",
                  color: colors.gray[500],
                }}
              >
                📅 Randevu: {formatDate(selectedAppt.date)} -{" "}
                {formatTime(selectedAppt.startTime)}
              </div>
            </div>
            <Textarea
              rows={4}
              placeholder="Randevu notu yazın..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                marginTop: "16px",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="secondary"
                onClick={() => !savingNote && setSelectedAppt(null)}
                disabled={savingNote}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                onClick={saveNote}
                disabled={savingNote}
              >
                {savingNote ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={showFollowUp}
        onClose={() => {
          setShowFollowUp(false);
          setFollowUpUser("");
          setFollowUpDate("");
          setFollowUpSlots([]);
        }}
        title="Takip Randevusu Oluştur"
        maxWidth="600px"
      >
        <div style={{ marginBottom: "16px" }}>
          <label style={commonStyles.formLabel}>👤 Kullanıcı Seçin</label>
          <select
            style={commonStyles.select}
            value={followUpUser}
            onChange={(e) => setFollowUpUser(e.target.value)}
          >
            <option value="">Kullanıcı seçin...</option>
            {uniqueUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {followUpUser && (
          <>
            <div style={{ marginBottom: "16px" }}>
              <Input
                label="📅 Tarih Seçin"
                type="date"
                min={todayStr}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </div>

            {followUpDate && (
              <div>
                <h3
                  style={{
                    fontSize: "clamp(14px, 2vw, 16px)",
                    fontWeight: 600,
                    color: colors.gray[900],
                    marginBottom: "12px",
                  }}
                >
                  ⏰ Uygun Saatler
                </h3>
                {loadingSlots ? (
                  <Loading message="Yükleniyor..." />
                ) : followUpSlots.length === 0 ? (
                  <EmptyState message="Bu tarihte uygun saat bulunamadı." />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: "8px",
                    }}
                  >
                    {followUpSlots.map((s, i) => (
                      <Button
                        key={i}
                        variant="secondary"
                        onClick={() => createFollowUp(s.start, s.end)}
                        style={{
                          fontSize: "clamp(11px, 1.5vw, 14px)",
                          padding: "12px 16px",
                          border: `2px solid ${colors.primary[200]}`,
                          color: colors.primary[800],
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span>{s.start}</span>
                        <span style={{ fontSize: "10px" }}>—</span>
                        <span>{s.end}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "24px",
          }}
        >
          <Button
            variant="secondary"
            onClick={() => {
              setShowFollowUp(false);
              setFollowUpUser("");
              setFollowUpDate("");
              setFollowUpSlots([]);
            }}
          >
            Kapat
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
