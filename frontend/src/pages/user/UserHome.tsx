import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Alert,
  Button,
  Loading,
  EmptyState,
  Modal,
} from "../../components/common";
import { commonStyles, colors, getButtonHoverHandlers } from "../../styles/commonStyles";
import { formatDate } from "../../utils/formatters";

type Department = {
  id: number;
  name: string;
  branches: { id: number; name: string; departmentId: number }[];
};
type Provider = {
  id: number;
  fullName: string;
  email: string;
  sessionDurationMinutes: number;
};
type Slot = { start: string; end: string };

export default function UserHome() {
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState<number | "">("");
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>([]);

  const [loadingDeps, setLoadingDeps] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoadingDeps(true);
    setError(null);
    try {
      const { data } = await api.get<Department[]>("/user/departments");
      setDepartmentList(data);
    } catch {
      setError("Departman/şube listesi yüklenemedi.");
    } finally {
      setLoadingDeps(false);
    }
  }

  async function loadProviders(id: number) {
    setLoadingProviders(true);
    setError(null);
    try {
      const { data } = await api.get<Provider[]>(
        `/user/branches/${id}/providers`
      );
      setProviders(data);
    } catch {
      setError("İlgili listesi yüklenemedi.");
    } finally {
      setLoadingProviders(false);
    }
  }

  async function loadSlots(pid: number, d: string) {
    if (!d || !pid) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setError(null);
    try {
      const { data } = await api.get(`/user/providers/${pid}/slots`, {
        params: { date: d },
      });
      const mapped: Slot[] = (data || []).map((x: any) => ({
        start: x.start || x.Start,
        end: x.end || x.End,
      }));
      setSlots(mapped);
    } catch {
      setError("Uygun saatler yüklenemedi.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function confirmBooking() {
    if (!selectedSlot) return;
    setError(null);
    setBooking(true);
    try {
      await api.post("/user/appointments", {
        providerId,
        date,
        start: selectedSlot.start,
        end: selectedSlot.end,
      });

      setShowConfirm(false);
      setSelectedSlot(null);
      setShowSuccess(true);
      if (providerId && date) await loadSlots(Number(providerId), date);
    } catch (e: any) {
      const msg = e?.response?.data ?? "Randevu alınamadı";
      setShowConfirm(false);
      setSelectedSlot(null);
      if (
        typeof msg === "string" &&
        msg.includes("Profilinizdeki gerekli bilgileri tamamlayın")
      ) {
        setShowProfileModal(true);
      } else {
        setError(typeof msg === "string" ? msg : "Randevu alınamadı.");
      }
    } finally {
      setBooking(false);
    }
  }

  const allBranches = useMemo(
    () =>
      departmentList.flatMap((d) =>
        d.branches.map((b) => ({ ...b, depName: d.name }))
      ),
    [departmentList]
  );

  const selectedProvider = useMemo(
    () =>
      providers.find(
        (p) => p.id === (typeof providerId === "number" ? providerId : -1)
      ),
    [providers, providerId]
  );

  const selectedBranch = useMemo(
    () => allBranches.find((b) => b.id === branchId),
    [allBranches, branchId]
  );

  const todayStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Randevu Al"
        subtitle="Şube, ilgili ve tarih seçerek uygun saatleri görüntüleyin."
      />

      <Card style={{ marginBottom: "16px" }}>
        {error && <Alert type="error" message={error} />}

        <div style={commonStyles.grid.formGrid}>
          <div>
            <label style={commonStyles.formLabel}>🏢 Departman/Şube</label>
            <select
              style={commonStyles.select}
              value={branchId}
              onChange={async (e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setBranchId("");
                  setProviders([]);
                  setProviderId("");
                  setDate("");
                  setSlots([]);
                  return;
                }
                const id = Number(raw);
                setBranchId(id);
                setProviders([]);
                setProviderId("");
                setDate("");
                setSlots([]);
                await loadProviders(id);
              }}
              disabled={loadingDeps}
            >
              <option value="">Şube seçin</option>
              {allBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.depName} - {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={commonStyles.formLabel}>👤 İlgili</label>
            <select
              style={commonStyles.select}
              value={providerId}
              onChange={async (e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setProviderId("");
                  setSlots([]);
                  return;
                }
                const id = Number(raw);
                setProviderId(id);
                await loadSlots(id, date);
              }}
              disabled={!branchId || loadingProviders}
            >
              <option value="">İlgili seçin</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName || p.email}
                </option>
              ))}
            </select>
            {!!selectedProvider && (
              <div
                style={{
                  marginTop: 6,
                  fontSize: "clamp(11px, 1.5vw, 12px)",
                  color: colors.gray[500],
                }}
              >
                ⏱️ Seans süresi: {selectedProvider.sessionDurationMinutes} dk
              </div>
            )}
          </div>

          <div>
            <label style={commonStyles.formLabel}>📅 Tarih</label>
            <input
              style={commonStyles.input}
              type="date"
              min={todayStr}
              value={date}
              onChange={async (e) => {
                const d = e.target.value;
                setDate(d);
                if (typeof providerId === "number") {
                  await loadSlots(providerId, d);
                } else {
                  setSlots([]);
                }
              }}
              disabled={!branchId || !providerId}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 style={commonStyles.cardSubheader}>⏰ Uygun Saatler</h2>

        {(!branchId || !providerId || !date) && (
          <EmptyState message="Saatleri görmek için şube, ilgili ve tarih seçin." />
        )}

        {loadingSlots && <Loading message="Saatler yükleniyor..." />}

        {!loadingSlots &&
          branchId &&
          providerId &&
          date &&
          slots.length === 0 && (
            <EmptyState message="Seçilen tarihte uygun saat bulunamadı. Lütfen başka bir tarih deneyin." />
          )}

        {slots.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "12px",
            }}
          >
            {slots.map((s, i) => (
              <button
                key={`${s.start}-${s.end}-${i}`}
                onClick={() => {
                  setSelectedSlot(s);
                  setShowConfirm(true);
                }}
                style={{
                  padding: "12px 16px",
                  border: `2px solid ${colors.primary[200]}`,
                  background: "white",
                  color: colors.primary[800],
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "clamp(12px, 2vw, 15px)",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  wordBreak: "break-word",
                }}
                {...getButtonHoverHandlers("secondary")}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.primary[50];
                  e.currentTarget.style.borderColor = colors.primary[400];
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary[200]}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.borderColor = colors.primary[200];
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "clamp(11px, 1.5vw, 13px)", color: colors.gray[500] }}>
                  ⏰
                </span>
                <span>{s.start}</span>
                <span style={{ fontSize: "clamp(10px, 1.5vw, 12px)", color: colors.gray[400] }}>
                  —
                </span>
                <span>{s.end}</span>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={showConfirm}
        onClose={() => !booking && setShowConfirm(false)}
        title="Randevu Onayı"
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: colors.primary[50],
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "32px",
            }}
          >
            📅
          </div>
          <p style={{ color: colors.gray[500], fontSize: "clamp(12px, 2vw, 14px)" }}>
            Aşağıdaki bilgileri kontrol edin ve onaylayın.
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
          <div style={{ display: "grid", gap: "16px" }}>
            <div>
              <div
                style={{
                  fontSize: "clamp(10px, 1.5vw, 12px)",
                  fontWeight: 600,
                  color: colors.gray[500],
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Departman / Şube
              </div>
              <div
                style={{
                  fontSize: "clamp(14px, 2vw, 16px)",
                  fontWeight: 600,
                  color: colors.gray[900],
                  wordBreak: "break-word",
                }}
              >
                {selectedBranch?.depName} - {selectedBranch?.name}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: "clamp(10px, 1.5vw, 12px)",
                  fontWeight: 600,
                  color: colors.gray[500],
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                İlgili
              </div>
              <div
                style={{
                  fontSize: "clamp(14px, 2vw, 16px)",
                  fontWeight: 600,
                  color: colors.gray[900],
                  wordBreak: "break-word",
                }}
              >
                {selectedProvider?.fullName || selectedProvider?.email}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "clamp(10px, 1.5vw, 12px)",
                    fontWeight: 600,
                    color: colors.gray[500],
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Tarih
                </div>
                <div
                  style={{
                    fontSize: "clamp(14px, 2vw, 16px)",
                    fontWeight: 600,
                    color: colors.gray[900],
                  }}
                >
                  {formatDate(date)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: "clamp(10px, 1.5vw, 12px)",
                    fontWeight: 600,
                    color: colors.gray[500],
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Saat
                </div>
                <div
                  style={{
                    fontSize: "clamp(14px, 2vw, 16px)",
                    fontWeight: 600,
                    color: colors.gray[900],
                  }}
                >
                  {selectedSlot?.start} - {selectedSlot?.end}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: colors.primary[50],
            border: `1px solid ${colors.primary[200]}`,
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "24px",
            fontSize: "clamp(12px, 2vw, 13px)",
            color: colors.primary[800],
            lineHeight: 1.5,
          }}
        >
          💡 <strong>Not:</strong> Randevunuza zamanında gelmeyi unutmayın.
          Değişiklik için şube ile iletişime geçebilirsiniz.
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            onClick={() => !booking && setShowConfirm(false)}
            disabled={booking}
            style={{ flex: 1, minWidth: "120px" }}
          >
            İptal
          </Button>
          <Button
            variant="primary"
            onClick={confirmBooking}
            disabled={booking}
            style={{ flex: 1, minWidth: "120px" }}
          >
            {booking ? "Oluşturuluyor..." : "✓ Randevuyu Onayla"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Başarılı!"
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: colors.success[50],
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "32px",
            }}
          >
            ✓
          </div>
          <p
            style={{
              color: colors.gray[500],
              fontSize: "clamp(13px, 2vw, 15px)",
              lineHeight: "1.6",
              marginBottom: "24px",
              wordBreak: "break-word",
            }}
          >
            Randevunuz başarıyla oluşturuldu! Randevunuzu 'Randevularım'
            bölümünden görüntüleyebilirsiniz.
          </p>
          <Button variant="success" onClick={() => setShowSuccess(false)} fullWidth>
            Tamam
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Profil Bilgileri Eksik"
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: colors.warning[50],
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
              lineHeight: "1.6",
              marginBottom: "24px",
              wordBreak: "break-word",
            }}
          >
            Profilinizdeki gerekli bilgileri tamamlayın. Profil sayfasına gitmek ister misiniz?
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <Button
            variant="secondary"
            onClick={() => setShowProfileModal(false)}
            style={{ flex: 1, minWidth: "120px" }}
          >
            Hayır
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowProfileModal(false);
              navigate("/profile");
            }}
            style={{ flex: 1, minWidth: "120px" }}
          >
            Evet, Git
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
