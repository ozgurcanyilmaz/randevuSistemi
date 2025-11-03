import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

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

export default function OperatorWalkIn() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState<number | "">("");

  const [fullName, setFullName] = useState("");
  const [tcKimlikNo, setTcKimlikNo] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [loadingDeps, setLoadingDeps] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    setLoadingDeps(true);
    setError(null);
    try {
      const { data } = await api.get<Department[]>("/user/departments");
      setDepartments(data);
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

  async function createWalkIn() {
    setError(null);
    setSuccess(null);
    setCreating(true);

    try {
      const response = await api.post("/operator/appointments/walk-in", {
        fullName,
        tcKimlikNo,
        phoneNumber,
        gender,
        address,
        heightCm: heightCm === "" ? null : heightCm,
        weightKg: weightKg === "" ? null : weightKg,
        providerId,
        notes,
      });

      setSuccess(`${response.data.userFullName} için walk-in randevu başarıyla oluşturuldu ve onaylandı!`);
      
      setFullName("");
      setTcKimlikNo("");
      setPhoneNumber("");
      setGender("");
      setAddress("");
      setHeightCm("");
      setWeightKg("");
      setNotes("");
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (e: any) {
      const msg = e?.response?.data ?? "Randevu oluşturulamadı";
      setError(typeof msg === "string" ? msg : "Randevu oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  }

  const allBranches = useMemo(
    () =>
      departments.flatMap((d) =>
        d.branches.map((b) => ({ ...b, depName: d.name }))
      ),
    [departments]
  );

  const selectedProvider = useMemo(
    () =>
      providers.find(
        (p) => p.id === (typeof providerId === "number" ? providerId : -1)
      ),
    [providers, providerId]
  );

  const isFormValid = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      tcKimlikNo.trim().length === 11 &&
      phoneNumber.trim().length >= 10 &&
      ["Erkek", "Kadın", "Diğer"].includes(gender) &&
      address.trim().length >= 5 &&
      providerId !== ""
    );
  }, [fullName, tcKimlikNo, phoneNumber, gender, address, providerId]);

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
            Walk-in Randevu
          </h1>
          <p style={{ color: "#64748b" }}>
            Randevusuz gelen kullanıcılar için hızlı randevu oluşturun. Kullanıcı otomatik olarak bekleyen listesine eklenecektir.
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

        {success && (
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
            {success}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0",
              padding: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "16px",
              }}
            >
              👤 Kullanıcı Bilgileri
            </h2>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  Ad Soyad *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                  placeholder="Ahmet Yılmaz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  TC Kimlik No *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                  placeholder="12345678901"
                  maxLength={11}
                  value={tcKimlikNo}
                  onChange={(e) => setTcKimlikNo(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  Telefon *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                  placeholder="5551234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  Cinsiyet *
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white",
                  }}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Seçiniz</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  Adres *
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                  placeholder="Açık adres"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Boy (cm)
                  </label>
                  <input
                    type="number"
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="175"
                    value={heightCm}
                    onChange={(e) =>
                      setHeightCm(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Kilo (kg)
                  </label>
                  <input
                    type="number"
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="70"
                    value={weightKg}
                    onChange={(e) =>
                      setWeightKg(e.target.value === "" ? "" : Number(e.target.value))
                    }
                  />
                </div>
              </div>
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
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "16px",
              }}
            >
              📅 İlgili Seçimi
            </h2>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  🏢 Şube *
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white",
                  }}
                  value={branchId}
                  onChange={async (e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setBranchId("");
                      setProviders([]);
                      setProviderId("");
                      return;
                    }
                    const id = Number(raw);
                    setBranchId(id);
                    setProviders([]);
                    setProviderId("");
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
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  👤 İlgili *
                </label>
                <select
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white",
                  }}
                  value={providerId}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setProviderId("");
                      return;
                    }
                    const id = Number(raw);
                    setProviderId(id);
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
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  📝 Notlar
                </label>
                <textarea
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    minHeight: "80px",
                    resize: "vertical",
                  }}
                  placeholder="Randevu hakkında notlar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {!isFormValid && (
                <div
                  style={{
                    padding: "10px 12px",
                    background: "#fef3c7",
                    border: "1px solid #fcd34d",
                    borderRadius: "8px",
                    color: "#92400e",
                    fontSize: "13px",
                  }}
                >
                  ⚠️ Tüm zorunlu alanları doldurun (*)
                </div>
              )}

              <div
                style={{
                  padding: "12px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  color: "#1e40af",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                💡 <strong>Not:</strong> Walk-in randevu otomatik olarak bugünün tarihi ve şu anki saat ile oluşturulacak ve kullanıcı bekleyen listesine eklenecektir.
              </div>

              <button
                style={{
                  width: "100%",
                  background: isFormValid && !creating ? "#16a34a" : "#94a3b8",
                  color: "white",
                  fontWeight: "600",
                  padding: "14px 24px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isFormValid && !creating ? "pointer" : "not-allowed",
                  fontSize: "16px",
                  transition: "all 0.2s",
                }}
                onClick={createWalkIn}
                disabled={!isFormValid || creating}
                onMouseOver={(e) => {
                  if (isFormValid && !creating) {
                    e.currentTarget.style.background = "#15803d";
                  }
                }}
                onMouseOut={(e) => {
                  if (isFormValid && !creating) {
                    e.currentTarget.style.background = "#16a34a";
                  }
                }}
              >
                {creating ? "Oluşturuluyor..." : "✓ Walk-in Randevu Oluştur"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}