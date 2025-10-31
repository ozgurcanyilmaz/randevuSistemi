import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { login, getRoles } from "../services/auth";
import { loginSchema, type LoginFormData } from "../schemas/validationSchemas";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
    try {
      const email = data.email.trim();
      const password = data.password;
      await login(email, password);
      const roles = getRoles();
      if (roles.includes("Admin")) return navigate("/admin");
      if (roles.includes("Operator")) return navigate("/operator");
      if (roles.includes("ServiceProvider")) return navigate("/provider/appointments");
      return navigate("/");
    } catch (err: any) {
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
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
        padding: 24,
      }}
    >
      <div
        className="card shadow-sm border-0"
        style={{
          width: 420,
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div className="p-4">
          <h4
            className="mb-2 text-center"
            style={{ color: "#1e293b", fontWeight: 700 }}
          >
            Giriş Yap
          </h4>
          <p className="text-center mb-3" style={{ color: "#64748b" }}>
            Randevu sistemine erişmek için bilgilerinizi girin.
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                type="email"
                placeholder="ornek@gmail.com"
                autoComplete="username"
                autoFocus
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Şifre</label>
              <input
                className={`form-control ${
                  errors.password ? "is-invalid" : ""
                }`}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <div className="invalid-feedback d-block">
                  {errors.password.message}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary w-100"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>

            <div className="mt-3 text-center">
              <span className="text-muted me-1">Hesabın yok mu?</span>
              <Link to="/register">Hesap oluştur</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}