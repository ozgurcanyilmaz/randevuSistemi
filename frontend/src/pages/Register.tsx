import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { register as registerUser } from "../services/auth";
import {
  registerSchema,
  type RegisterFormData,
} from "../schemas/validationSchemas";

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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
    try {
      const fullName = (data.fullName ?? "").trim();
      const email = data.email.trim();
      const password = data.password;
      await registerUser(email, password, fullName);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 800);
    } catch (err: any) {
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
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
        padding: 24,
      }}
    >
      <div
        className="card shadow-sm border-0"
        style={{
          width: 440,
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div className="p-4">
          <h4
            className="mb-2 text-center"
            style={{ color: "#1e293b", fontWeight: 700 }}
          >
            Kayıt Ol
          </h4>
          <p className="text-center mb-3" style={{ color: "#64748b" }}>
            Hesap oluşturmak için bilgilerinizi girin.
          </p>

          {success && (
            <div className="alert alert-success" role="alert">
              Kayıt başarılı. Yönlendiriliyor...
            </div>
          )}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label className="form-label">Ad Soyad</label>
              <input
                className={`form-control ${
                  errors.fullName ? "is-invalid" : ""
                }`}
                placeholder="Adınız Soyadınız"
                autoComplete="name"
                autoFocus
                {...register("fullName")}
                aria-invalid={!!errors.fullName}
              />
              {errors.fullName && (
                <div className="invalid-feedback">
                  {errors.fullName.message}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                type="email"
                placeholder="ornek@gmail.com"
                autoComplete="email"
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
                autoComplete="new-password"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <div className="invalid-feedback">
                  {errors.password.message}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary w-100"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Kayıt yapılıyor..." : "Kayıt Ol"}
            </button>

            <div className="mt-3 text-center">
              <span className="text-muted me-1">Zaten hesabın var mı?</span>
              <Link to="/login">Giriş Yap</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
