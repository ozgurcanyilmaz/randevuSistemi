import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Department = {
  id: number;
  name: string;
  branches: { id: number; name: string }[];
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
  const [bookingBusy, setBookingBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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
      setInfo(
        mapped.length === 0 ? "Seçilen tarihte uygun saat bulunamadı." : null
      );
    } catch {
      setError("Uygun saatler yüklenemedi.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function book(start: string, end: string) {
    setError(null);
    setInfo(null);
    setBookingBusy(`${start}-${end}`);
    try {
      await api.post("/user/appointments", { providerId, date, start, end });
      setInfo("Randevu oluşturuldu!");
      if (providerId && date) await loadSlots(Number(providerId), date);
    } catch (e: any) {
      const msg = e?.response?.data ?? "Randevu alınamadı";
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
      setBookingBusy(null);
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
          {info && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                background: "#ecfeff",
                border: "1px solid #a5f3fc",
                color: "#155e75",
                borderRadius: 8,
              }}
            >
              {info}
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
              <label className="form-label">Departman/Şube</label>
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
              <label className="form-label">İlgili</label>
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
                  Seans süresi: {selectedProvider.sessionDurationMinutes} dk
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Tarih</label>
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
              fontSize: 16,
              fontWeight: 600,
              color: "#1e293b",
              margin: 0,
              marginBottom: 16,
            }}
          >
            Uygun Saatler
          </h2>

          {(!branchId || !providerId || !date) && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 20px",
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
                  padding: "32px 20px",
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px dashed #cbd5e1",
                }}
              >
                Uygun saat bulunamadı.
              </div>
            )}

          <div className="row mt-1">
            {slots.map((s, i) => {
              const busy = bookingBusy === `${s.start}-${s.end}`;
              return (
                <div className="col-auto mb-2" key={`${s.start}-${s.end}-${i}`}>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => book(s.start, s.end)}
                    disabled={!providerId || !date || !!bookingBusy}
                    style={{ whiteSpace: "nowrap" }}
                    onMouseOver={(e) =>
                      (e.currentTarget.className = "btn btn-primary")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.className = "btn btn-outline-primary")
                    }
                  >
                    {busy ? "Oluşturuluyor..." : `${s.start} - ${s.end}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
