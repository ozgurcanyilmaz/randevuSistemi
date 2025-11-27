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
import { colors } from "../../styles/commonStyles";
import { formatDate, formatDateTime } from "../../utils/formatters";

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge variant="warning">Devam Ediyor</Badge>;
      case 1:
        return <Badge variant="primary">Tamamlandı</Badge>;
      case 2:
        return <Badge variant="error">İptal Edildi</Badge>;
      default:
        return <Badge variant="gray">Bilinmiyor</Badge>;
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
    setCancelling(true);
    setError(null);
    try {
      await api.post(`/provider/sessions/${selectedSession.id}/cancel`);
      setSuccess("Görüşme iptal edildi!");
      setTimeout(() => setSuccess(null), 3000);
      await load();
      setShowCancelModal(false);
      setShowDetailModal(false);
      setSelectedSession(null);
    } catch {
      setError("Görüşme iptal edilemedi.");
    } finally {
      setCancelling(false);
    }
  }

  const tabs = [
    { id: "all", label: `📁 Tümü (${sessions.length})` },
    { id: "inProgress", label: `🔄 Devam Ediyor (${inProgress.length})` },
    { id: "completed", label: `✓ Tamamlandı (${completed.length})` },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Görüşmeler"
        subtitle="Tüm görüşmelerinizi görüntüleyin, güncelleyin ve tamamlayın."
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
            placeholder="Kullanıcı veya özete göre ara..."
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
                ? "Arama sonucuna uygun görüşme bulunamadı."
                : activeTab === "inProgress"
                ? "Devam eden görüşme bulunmuyor."
                : activeTab === "completed"
                ? "Tamamlanmış görüşme bulunmuyor."
                : "Henüz görüşme bulunmuyor."
            }
          />
        ) : (
          <div style={{ display: "grid", gap: "16px" }}>
            {filtered.map((sess) => {
              return (
                <Card
                  key={sess.id}
                  style={{
                    background: colors.gray[50],
                    border: `1px solid ${colors.gray[200]}`,
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => loadSessionDetail(sess.id)}
                  onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = colors.gray[300];
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                    e.currentTarget.style.background = colors.gray[50];
                    e.currentTarget.style.borderColor = colors.gray[200];
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
                        👤 {sess.userName}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(12px, 2vw, 14px)",
                          color: colors.gray[500],
                          marginBottom: "8px",
                        }}
                      >
                        📅 {formatDate(sess.appointmentDate)} • ⏰{" "}
                        {sess.appointmentTime}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(12px, 2vw, 14px)",
                          color: colors.gray[700],
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                        }}
                      >
                        <strong>Özet:</strong> {sess.summary}
                      </div>
                    </div>
                    <div style={{ marginLeft: "16px" }}>
                      {getStatusBadge(sess.status)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      fontSize: "clamp(11px, 1.5vw, 13px)",
                      color: colors.gray[500],
                      flexWrap: "wrap",
                    }}
                  >
                    <span>🕐 Başlangıç: {formatDateTime(sess.startedAt)}</span>
                    {sess.completedAt && (
                      <span>
                        ✓ Tamamlanma: {formatDateTime(sess.completedAt)}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        isOpen={showDetailModal}
        onClose={() =>
          !updating && !completing && setShowDetailModal(false)
        }
        title="Görüşme Detayı"
        maxWidth="800px"
      >
        {selectedSession && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "24px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "clamp(12px, 2vw, 14px)",
                    color: colors.gray[500],
                  }}
                >
                  👤 {selectedSession.user.name} • 📅{" "}
                  {formatDate(selectedSession.appointment.date)} • ⏰{" "}
                  {selectedSession.appointment.startTime}
                </div>
              </div>
              {getStatusBadge(selectedSession.status)}
            </div>

            {selectedSession.status === 1 && (
              <Alert
                type="info"
                message="ℹ️ Bu görüşme tamamlanmıştır. Bilgileri görüntüleyebilirsiniz."
              />
            )}

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <Textarea
                  label="Görüşme Özeti *"
                  rows={2}
                  value={editingSummary}
                  onChange={(e) => setEditingSummary(e.target.value)}
                  disabled={selectedSession.status === 1}
                />
              </div>

              <div>
                <Textarea
                  label="Notlar"
                  rows={3}
                  placeholder="Görüşme notları..."
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  disabled={selectedSession.status === 1}
                />
              </div>

              <div>
                <Textarea
                  label="Sonuç/Değerlendirme"
                  rows={3}
                  placeholder="Görüşme sonucu..."
                  value={editingOutcome}
                  onChange={(e) => setEditingOutcome(e.target.value)}
                  disabled={selectedSession.status === 1}
                />
              </div>

              <div>
                <Textarea
                  label="Aksiyon Maddeleri"
                  rows={2}
                  placeholder="Sonraki adımlar, ödevler..."
                  value={editingActionItems}
                  onChange={(e) => setEditingActionItems(e.target.value)}
                  disabled={selectedSession.status === 1}
                />
              </div>
              <div>
                <Textarea
                  label="🔒 Özel Notlar (Sadece sizin görebileceğiniz)"
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
                gap: "12px",
                marginTop: "24px",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              {selectedSession.status === 0 && (
                <>
                  <Button
                    variant="danger"
                    onClick={() => setShowCancelModal(true)}
                  >
                    ❌ İptal Et
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={updateSession}
                    disabled={updating}
                  >
                    {updating ? "Kaydediliyor..." : "💾 Kaydet"}
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => setShowCompleteModal(true)}
                  >
                    ✓ Görüşmeyi Tamamla
                  </Button>
                </>
              )}
              {selectedSession.status === 1 && (
                <Button
                  variant="secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Kapat
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => !completing && setShowCompleteModal(false)}
        title="Görüşmeyi Tamamla"
      >
        <p
          style={{
            color: colors.gray[500],
            marginBottom: "24px",
            lineHeight: 1.6,
            fontSize: "clamp(12px, 2vw, 14px)",
            wordBreak: "break-word",
          }}
        >
          Bu görüşmeyi tamamlamak istediğinizden emin misiniz?
          Tamamlandıktan sonra görüşme bilgileri düzenlenemez.
        </p>
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
            onClick={() => !completing && setShowCompleteModal(false)}
            disabled={completing}
          >
            İptal
          </Button>
          <Button
            variant="success"
            onClick={completeSession}
            disabled={completing}
          >
            {completing ? "Tamamlanıyor..." : "✓ Evet, Tamamla"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => !cancelling && setShowCancelModal(false)}
        title="Görüşmeyi İptal Et"
      >
        <p
          style={{
            color: colors.gray[500],
            marginBottom: "24px",
            lineHeight: 1.6,
            fontSize: "clamp(12px, 2vw, 14px)",
            wordBreak: "break-word",
          }}
        >
          Bu görüşmeyi iptal etmek istediğinizden emin misiniz?
        </p>
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
            onClick={() => !cancelling && setShowCancelModal(false)}
            disabled={cancelling}
          >
            İptal
          </Button>
          <Button
            variant="danger"
            onClick={cancelSession}
            disabled={cancelling}
          >
            {cancelling ? "İptal Ediliyor..." : "✓ Evet, İptal Et"}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
