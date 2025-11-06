import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "../../services/api";

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
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              color: "#64748b",
            }}
          >
            Yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 30,
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: 8,
            }}
          >
            Profilim
          </h1>
          <p style={{ color: "#64748b" }}>
            Randevu alabilmek için zorunlu alanları doldurmanız gerekir.
          </p>
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
          {success && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                color: "#166534",
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {success}
            </div>
          )}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: 8,
                }}
              >
                Email (değiştirilemez)
              </label>
              <input
                value={email}
                readOnly
                className="form-control"
                style={{ background: "#f8fafc", cursor: "not-allowed" }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              <div>
                <label className="form-label">Ad Soyad</label>
                <input
                  className={`form-control ${
                    errors.fullName ? "is-invalid" : ""
                  }`}
                  placeholder="Ad Soyad"
                  {...register("fullName", {
                    required: "Zorunludur",
                    minLength: { value: 2, message: "En az 2 karakter" },
                  })}
                />
                {errors.fullName && (
                  <div className="invalid-feedback">
                    {errors.fullName.message as any}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Telefon</label>
                <input
                  className={`form-control ${
                    errors.phoneNumber ? "is-invalid" : ""
                  }`}
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
                />
                {errors.phoneNumber && (
                  <div className="invalid-feedback">
                    {errors.phoneNumber.message as any}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">TC Kimlik No</label>
                <input
                  className={`form-control ${
                    errors.tcKimlikNo ? "is-invalid" : ""
                  }`}
                  placeholder="11 hane"
                  {...register("tcKimlikNo", {
                    required: "Zorunludur",
                    minLength: { value: 11, message: "11 haneli olmalı" },
                    maxLength: { value: 11, message: "11 haneli olmalı" },
                    pattern: { value: /^[0-9]+$/, message: "Sadece rakam" },
                  })}
                />
                {errors.tcKimlikNo && (
                  <div className="invalid-feedback">
                    {errors.tcKimlikNo.message as any}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Cinsiyet</label>
                <select
                  className={`form-control select2 ${
                    errors.gender ? "is-invalid" : ""
                  }`}
                  {...register("gender", {
                    required: "Zorunludur",
                    validate: (v) =>
                      ["Erkek", "Kadın", "Diğer"].includes(v) ||
                      "Geçersiz değer",
                  })}
                >
                  <option value="">Seçiniz</option>
                  <option value="Erkek">Erkek</option>
                  <option value="Kadın">Kadın</option>
                  <option value="Diğer">Diğer</option>
                </select>
                {errors.gender && (
                  <div className="invalid-feedback">
                    {errors.gender.message as any}
                  </div>
                )}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Adres</label>
                <input
                  className={`form-control ${
                    errors.address ? "is-invalid" : ""
                  }`}
                  placeholder="Açık adres"
                  {...register("address", {
                    required: "Zorunludur",
                    minLength: { value: 5, message: "Çok kısa" },
                  })}
                />
                {errors.address && (
                  <div className="invalid-feedback">
                    {errors.address.message as any}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Boy (cm)</label>
                <input
                  className={`form-control ${
                    errors.heightCm ? "is-invalid" : ""
                  }`}
                  type="number"
                  min={0}
                  step={1}
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
                />
                {errors.heightCm && (
                  <div className="invalid-feedback">
                    {errors.heightCm.message as any}
                  </div>
                )}
              </div>

              <div>
                <label className="form-label">Kilo (kg)</label>
                <input
                  className={`form-control ${
                    errors.weightKg ? "is-invalid" : ""
                  }`}
                  type="number"
                  min={0}
                  step={1}
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
                />
                {errors.weightKg && (
                  <div className="invalid-feedback">
                    {errors.weightKg.message as any}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: "#2563eb",
                  borderColor: "#2563eb",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = "#1d4ed8")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "#2563eb")
                }
              >
                {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>

          <div
            style={{
              marginTop: 16,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1e40af",
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            Randevu alabilmek için Ad Soyad, TC Kimlik No, Telefon No, Cinsiyet
            ve Adres bilgilerinizin dolu olması gerekir.
          </div>
        </div>
      </div>
    </div>
  );
}
