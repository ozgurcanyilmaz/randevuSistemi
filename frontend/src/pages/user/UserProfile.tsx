import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Alert,
  Button,
  Loading,
  Input,
} from "../../components/common";
import { commonStyles, colors } from "../../styles/commonStyles";

type Profile = {
  email: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  tcKimlikNo?: string | null;
  gender?: string | null;
  address?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
};

type FormData = {
  fullName?: string;
  phoneNumber: string;
  tcKimlikNo: string;
  gender: string;
  address: string;
  heightCm?: number | "";
  weightKg?: number | "";
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ mode: "onBlur" });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Profile>("/user/profile");
      setEmail(data.email);
      setValue("fullName", data.fullName ?? undefined);
      setValue("phoneNumber", data.phoneNumber ?? "");
      setValue("tcKimlikNo", data.tcKimlikNo ?? "");
      setValue("gender", data.gender ?? "");
      setValue("address", data.address ?? "");
      setValue("heightCm", (data.heightCm ?? "") as any);
      setValue("weightKg", (data.weightKg ?? "") as any);
    } catch {
      setError("Profil yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: FormData) {
    setError(null);
    setSuccess(null);
    try {
      const toNumberOrUndefined = (val: number | "" | undefined) =>
        val === "" || val === undefined || val === (null as any)
          ? undefined
          : Number(val);

      const h = toNumberOrUndefined(values.heightCm);
      const w = toNumberOrUndefined(values.weightKg);

      const payload = {
        fullName:
          values.fullName && values.fullName.trim()
            ? values.fullName.trim()
            : undefined,
        phoneNumber: values.phoneNumber.trim(),
        tcKimlikNo: values.tcKimlikNo.trim(),
        gender: values.gender.trim(),
        address: values.address.trim(),
        heightCm: h === undefined ? undefined : Math.max(0, h),
        weightKg: w === undefined ? undefined : Math.max(0, w),
      };

      await api.put("/user/profile", payload);
      setSuccess("Profil güncellendi");
    } catch {
      setError("Profil güncellenemedi");
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <Loading message="Yükleniyor..." />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Profilim"
        subtitle="Randevu alabilmek için zorunlu alanları doldurmanız gerekir."
      />

      <Card>
        {success && <Alert type="success" message={success} />}
        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: "16px" }}>
            <Input
              label="Email (değiştirilemez)"
              value={email}
              readOnly
              disabled
            />
          </div>

          <div style={commonStyles.grid.formGrid}>
            <div>
              <Input
                label="Ad Soyad"
                placeholder="Ad Soyad"
                {...register("fullName", {
                  required: "Zorunludur",
                  minLength: { value: 2, message: "En az 2 karakter" },
                })}
                error={errors.fullName?.message}
              />
            </div>

            <div>
              <Input
                label="Telefon"
                placeholder="5XX..."
                {...register("phoneNumber", {
                  required: "Zorunludur",
                  minLength: {
                    value: 10,
                    message: "Geçerli bir telefon giriniz",
                  },
                  pattern: {
                    value: /^[0-9+\-()\s]+$/,
                    message: "Geçersiz format",
                  },
                })}
                error={errors.phoneNumber?.message}
              />
            </div>

            <div>
              <Input
                label="TC Kimlik No"
                placeholder="11 hane"
                {...register("tcKimlikNo", {
                  required: "Zorunludur",
                  minLength: { value: 11, message: "11 haneli olmalı" },
                  maxLength: { value: 11, message: "11 haneli olmalı" },
                  pattern: { value: /^[0-9]+$/, message: "Sadece rakam" },
                })}
                error={errors.tcKimlikNo?.message}
              />
            </div>

            <div>
              <label style={commonStyles.formLabel}>
                Cinsiyet <span style={{ color: colors.error[600] }}>*</span>
              </label>
              <select
                style={commonStyles.select}
                {...register("gender", {
                  required: "Zorunludur",
                  validate: (v) =>
                    ["Erkek", "Kadın", "Diğer"].includes(v) || "Geçersiz değer",
                })}
              >
                <option value="">Seçiniz</option>
                <option value="Erkek">Erkek</option>
                <option value="Kadın">Kadın</option>
                <option value="Diğer">Diğer</option>
              </select>
              {errors.gender && (
                <div
                  style={{
                    color: colors.error[600],
                    fontSize: "12px",
                    marginTop: "4px",
                  }}
                >
                  {errors.gender.message}
                </div>
              )}
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <Input
                label="Adres"
                placeholder="Açık adres"
                {...register("address", {
                  required: "Zorunludur",
                  minLength: { value: 5, message: "Çok kısa" },
                })}
                error={errors.address?.message}
              />
            </div>

            <div>
              <Input
                label="Boy (cm)"
                type="number"
                placeholder="örn. 175"
                {...register("heightCm", {
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === "" || v === null || v === undefined)
                      return "" as any;
                    const n = Number(v);
                    if (Number.isNaN(n)) return undefined as any;
                    return Math.max(0, n) as any;
                  },
                  min: { value: 0, message: "Negatif olamaz" },
                  max: { value: 300, message: "Geçersiz" },
                })}
                error={errors.heightCm?.message}
              />
            </div>

            <div>
              <Input
                label="Kilo (kg)"
                type="number"
                placeholder="örn. 70"
                {...register("weightKg", {
                  valueAsNumber: true,
                  setValueAs: (v) => {
                    if (v === "" || v === null || v === undefined)
                      return "" as any;
                    const n = Number(v);
                    if (Number.isNaN(n)) return undefined as any;
                    return Math.max(0, n) as any;
                  },
                  min: { value: 0, message: "Negatif olamaz" },
                  max: { value: 500, message: "Geçersiz" },
                })}
                error={errors.weightKg?.message}
              />
            </div>
          </div>

          <div style={{ marginTop: "20px" }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>

        <div
          style={{
            marginTop: "16px",
            background: colors.primary[50],
            border: `1px solid ${colors.primary[200]}`,
            color: colors.primary[800],
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "clamp(12px, 2vw, 14px)",
            wordBreak: "break-word",
          }}
        >
          Randevu alabilmek için Ad Soyad, TC Kimlik No, Telefon No, Cinsiyet ve
          Adres bilgilerinizin dolu olması gerekir.
        </div>
      </Card>
    </PageContainer>
  );
}
