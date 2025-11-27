import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Alert,
  Button,
  Input,
  Textarea,
  Loading,
} from "../../components/common";
import { commonStyles, colors } from "../../styles/commonStyles";

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

      setSuccess(
        `${response.data.userFullName} için walk-in randevu başarıyla oluşturuldu ve onaylandı!`
      );

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
    <PageContainer>
      <PageHeader
        title="Walk-in Randevu"
        subtitle="Randevusuz gelen kullanıcılar için hızlı randevu oluşturun. Kullanıcı otomatik olarak bekleyen listesine eklenecektir."
      />

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
        }}
      >
        <Card>
          <h2 style={commonStyles.cardSubheader}>👤 Kullanıcı Bilgileri</h2>

          <div style={{ display: "grid", gap: "16px" }}>
            <Input
              label="Ad Soyad *"
              placeholder="Ahmet Yılmaz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="TC Kimlik No *"
              placeholder="12345678901"
              maxLength={11}
              value={tcKimlikNo}
              onChange={(e) => setTcKimlikNo(e.target.value)}
            />

            <Input
              label="Telefon *"
              placeholder="5551234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <div>
              <label style={commonStyles.formLabel}>Cinsiyet *</label>
              <select
                style={commonStyles.select}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>

            <Input
              label="Adres *"
              placeholder="Açık adres"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <Input
                label="Boy (cm)"
                type="number"
                placeholder="175"
                value={heightCm}
                onChange={(e) =>
                  setHeightCm(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
              <Input
                label="Kilo (kg)"
                type="number"
                placeholder="70"
                value={weightKg}
                onChange={(e) =>
                  setWeightKg(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2 style={commonStyles.cardSubheader}>📅 İlgili Seçimi</h2>

          <div style={{ display: "grid", gap: "16px" }}>
            {loadingDeps ? (
              <Loading message="Şubeler yükleniyor..." />
            ) : (
              <>
                <div>
                  <label style={commonStyles.formLabel}>🏢 Şube *</label>
                  <select
                    style={commonStyles.select}
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
                  <label style={commonStyles.formLabel}>👤 İlgili *</label>
                  <select
                    style={{
                      ...commonStyles.select,
                      background: !branchId ? colors.gray[100] : "white",
                      cursor: !branchId ? "not-allowed" : "pointer",
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
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "clamp(11px, 1.5vw, 12px)",
                        color: colors.gray[500],
                      }}
                    >
                      ⏱️ Seans süresi: {selectedProvider.sessionDurationMinutes}{" "}
                      dk
                    </div>
                  )}
                </div>
              </>
            )}

            <Textarea
              label="📝 Notlar"
              placeholder="Randevu hakkında notlar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            {!isFormValid && (
              <Alert
                type="warning"
                message="⚠️ Tüm zorunlu alanları doldurun (*)"
              />
            )}

            <div
              style={{
                padding: "12px",
                background: colors.primary[50],
                border: `1px solid ${colors.primary[200]}`,
                borderRadius: "8px",
                color: colors.primary[800],
                fontSize: "clamp(12px, 2vw, 13px)",
                lineHeight: 1.5,
                wordBreak: "break-word",
              }}
            >
              💡 <strong>Not:</strong> Walk-in randevu otomatik olarak bugünün
              tarihi ve şu anki saat ile oluşturulacak ve kullanıcı bekleyen
              listesine eklenecektir.
            </div>

            <Button
              variant="success"
              onClick={createWalkIn}
              disabled={!isFormValid || creating}
              fullWidth
            >
              {creating ? "Oluşturuluyor..." : "✓ Walk-in Randevu Oluştur"}
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
