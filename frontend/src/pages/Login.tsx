import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import ReCAPTCHA from "react-google-recaptcha";
import { login, getRoles } from "../services/auth";
import { loginSchema, type LoginFormData } from "../schemas/validationSchemas";
import { Card, Alert, Button } from "../components/common";
import { commonStyles, colors } from "../styles/commonStyles";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onBlur",
  });

  async function onSubmit(data: LoginFormData) {
    if (isSubmitting) return;
    setError(null);

    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      setError("Lütfen 'Robot değilim' kutucuğunu işaretleyin");
      return;
    }

    try {
      const email = data.email.trim();
      const password = data.password;
      await login(email, password, recaptchaToken);

      const roles = getRoles();
      if (roles.includes("Admin")) return navigate("/admin");
      if (roles.includes("Operator")) return navigate("/operator/dashboard");
      if (roles.includes("ServiceProvider"))
        return navigate("/provider/appointments");
      return navigate("/");
    } catch (err: any) {
      recaptchaRef.current?.reset();
      const msg =
        err?.response?.data?.message ||
        "Giriş başarısız. Email veya şifrenizi kontrol ediniz.";
      setError(msg);
      setFormError("password", {
        type: "manual",
        message: "E-posta veya şifre hatalı.",
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
      <Card style={{ width: "100%", maxWidth: 420 }}>
        <h4
          style={{
            ...commonStyles.pageTitle,
            fontSize: "24px",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          Giriş Yap
        </h4>
        <p
          style={{
            ...commonStyles.pageSubtitle,
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          Randevu sistemine erişmek için bilgilerinizi girin.
        </p>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ marginBottom: "16px" }}>
            <label style={commonStyles.formLabel}>Email *</label>
            <input
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="ornek@gmail.com"
              autoComplete="username"
              autoFocus
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
              autoComplete="current-password"
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
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>

          <div
            style={{
              marginTop: "16px",
              textAlign: "center",
              color: colors.gray[500],
            }}
          >
            <span>Hesabın yok mu? </span>
            <Link
              to="/register"
              style={{
                color: colors.primary[600],
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Hesap oluştur
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
