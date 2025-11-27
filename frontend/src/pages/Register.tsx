import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ReCAPTCHA from "react-google-recaptcha";
import { register as registerUser } from "../services/auth";
import {
  registerSchema,
  type RegisterFormData,
} from "../schemas/validationSchemas";
import { Card, Alert, Button } from "../components/common";
import { commonStyles, colors } from "../styles/commonStyles";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    mode: "onBlur",
  });

  async function onSubmit(data: RegisterFormData) {
    if (isSubmitting) return;
    setError(null);

    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      setError("Lütfen 'Robot değilim' kutucuğunu işaretleyin");
      return;
    }

    try {
      const fullName = (data.fullName ?? "").trim();
      const email = data.email.trim();
      const password = data.password;
      await registerUser(email, password, fullName, recaptchaToken);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 800);
    } catch (err: any) {
      recaptchaRef.current?.reset();
      const msg =
        err?.response?.data?.message ||
        "Kayıt başarısız. Bu email zaten kullanılıyor olabilir.";
      setError(msg);
      setFormError("email", {
        type: "manual",
        message: "Email kullanılıyor olabilir.",
      });
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...commonStyles.pageContainer,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 440 }}>
        <h4
          style={{
            ...commonStyles.pageTitle,
            fontSize: "24px",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          Kayıt Ol
        </h4>
        <p
          style={{
            ...commonStyles.pageSubtitle,
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          Hesap oluşturmak için bilgilerinizi girin.
        </p>

        {success && (
          <Alert type="success" message="Kayıt başarılı. Yönlendiriliyor..." />
        )}
        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: "16px" }}>
            <label style={commonStyles.formLabel}>Ad Soyad *</label>
            <input
              className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
              placeholder="Adınız Soyadınız"
              autoComplete="name"
              autoFocus
              {...register("fullName")}
              aria-invalid={!!errors.fullName}
              style={commonStyles.input}
            />
            {errors.fullName && (
              <div style={{ color: colors.error[600], fontSize: "12px", marginTop: "4px" }}>
                {errors.fullName.message}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={commonStyles.formLabel}>Email *</label>
            <input
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="ornek@gmail.com"
              autoComplete="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              style={commonStyles.input}
            />
            {errors.email && (
              <div style={{ color: colors.error[600], fontSize: "12px", marginTop: "4px" }}>
                {errors.email.message}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={commonStyles.formLabel}>Şifre *</label>
            <input
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="••••••••"
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              style={commonStyles.input}
            />
            {errors.password && (
              <div style={{ color: colors.error[600], fontSize: "12px", marginTop: "4px" }}>
                {errors.password.message}
              </div>
            )}
          </div>

          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              theme="light"
            />
          </div>

          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </Button>

          <div
            style={{
              marginTop: "16px",
              textAlign: "center",
              color: colors.gray[500],
            }}
          >
            <span>Zaten hesabın var mı? </span>
            <Link
              to="/login"
              style={{
                color: colors.primary[600],
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Giriş Yap
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
