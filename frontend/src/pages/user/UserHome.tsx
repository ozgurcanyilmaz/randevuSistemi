import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

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
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);

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
      if (providerId && date) await loadSlots(Number(providerId), date);

      // Show success modal
      const modal = document.createElement("div");
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 500px;
        text-align: center;
      `;
      modal.innerHTML = `
        <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px;">✓</div>
        <h2 style="font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">Başarılı!</h2>
        <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Randevunuz başarıyla oluşturuldu! Randevunuzu 'Randevularım' bölümünden görüntüleyebilirsiniz.</p>
        <button onclick="this.parentElement.remove()" style="background: #16a34a; color: white; font-weight: 600; padding: 12px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 15px;">Tamam</button>
      `;
      document.body.appendChild(modal);
      setTimeout(() => modal.remove(), 5000);
    } catch (e: any) {
      const msg = e?.response?.data ?? "Randevu alınamadı";
      setShowConfirm(false);
      setSelectedSlot(null);
      if (
        typeof msg === "string" &&
        msg.includes("Profilinizdeki gerekli bilgileri tamamlayın")
      ) {
        if (
          confirm(
            "Profilinizdeki gerekli bilgileri tamamlayın. Profil sayfasına gitmek ister misiniz?"
          )
        ) {
          window.location.href = "/profile";
        }
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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 30,
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: 8,
            }}
          >
            Randevu Al
          </h1>
          <p style={{ color: "#64748b" }}>
            Şube, ilgili ve tarih seçerek uygun saatleri görüntüleyin.
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            padding: 24,
            marginBottom: 16,
          }}
        >
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <label className="form-label">🏢 Departman/Şube</label>
              <select
                className="form-control select2"
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
              <label className="form-label">👤 İlgili</label>
              <select
                className="form-control select2"
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
                <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
                  ⏱️ Seans süresi: {selectedProvider.sessionDurationMinutes} dk
                </div>
              )}
            </div>

            <div>
              <label className="form-label">📅 Tarih</label>
              <input
                className="form-control"
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
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            padding: 24,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#1e293b",
              margin: 0,
              marginBottom: 16,
            }}
          >
            ⏰ Uygun Saatler
          </h2>

          {(!branchId || !providerId || !date) && (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: "#94a3b8",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px dashed #cbd5e1",
              }}
            >
              Saatleri görmek için şube, ilgili ve tarih seçin.
            </div>
          )}

          {loadingSlots && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                borderRadius: 8,
              }}
            >
              Saatler yükleniyor...
            </div>
          )}

          {!loadingSlots &&
            branchId &&
            providerId &&
            date &&
            slots.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 20px",
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px dashed #cbd5e1",
                }}
              >
                Seçilen tarihte uygun saat bulunamadı. Lütfen başka bir tarih
                deneyin.
              </div>
            )}

          {slots.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 12,
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
                    padding: "16px 20px",
                    border: "2px solid #bfdbfe",
                    background: "white",
                    color: "#1e40af",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 15,
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "#eff6ff";
                    e.currentTarget.style.borderColor = "#60a5fa";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(37, 99, 235, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "white";
                    e.currentTarget.style.borderColor = "#bfdbfe";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <span style={{ fontSize: 13, color: "#64748b" }}>⏰</span>
                  <span>{s.start}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                  <span>{s.end}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {showConfirm && selectedSlot && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => !booking && setShowConfirm(false)}
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
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: "#eff6ff",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    fontSize: 32,
                  }}
                >
                  📅
                </div>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: 8,
                  }}
                >
                  Randevu Onayı
                </h2>
                <p style={{ color: "#64748b", fontSize: 14 }}>
                  Aşağıdaki bilgileri kontrol edin ve onaylayın.
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
                  style={{
                    display: "grid",
                    gap: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Departman / Şube
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {selectedBranch?.depName} - {selectedBranch?.name}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      İlgili
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#1e293b",
                      }}
                    >
                      {selectedProvider?.fullName || selectedProvider?.email}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Tarih
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        {new Date(date).toLocaleDateString("tr-TR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 4,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Saat
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#1e293b",
                        }}
                      >
                        {selectedSlot.start} - {selectedSlot.end}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                  fontSize: 13,
                  color: "#1e40af",
                  lineHeight: 1.5,
                }}
              >
                💡 <strong>Not:</strong> Randevunuza zamanında gelmeyi
                unutmayın. Değişiklik için şube ile iletişime geçebilirsiniz.
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
                  onClick={() => !booking && setShowConfirm(false)}
                  disabled={booking}
                  onMouseOver={(e) => {
                    if (!booking) e.currentTarget.style.background = "#f1f5f9";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  İptal
                </button>
                <button
                  style={{
                    flex: 1,
                    background: "#2563eb",
                    color: "white",
                    fontWeight: 600,
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: 8,
                    cursor: booking ? "not-allowed" : "pointer",
                    fontSize: 15,
                    transition: "all 0.2s",
                  }}
                  onClick={confirmBooking}
                  disabled={booking}
                  onMouseOver={(e) => {
                    if (!booking) e.currentTarget.style.background = "#1d4ed8";
                  }}
                  onMouseOut={(e) => {
                    if (!booking) e.currentTarget.style.background = "#2563eb";
                  }}
                >
                  {booking ? "Oluşturuluyor..." : "✓ Randevuyu Onayla"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
