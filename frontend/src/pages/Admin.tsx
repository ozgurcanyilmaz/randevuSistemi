import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";

type Branch = { id: number; name: string; departmentId: number };
type Department = { id: number; name: string; branches?: Branch[] };
type UserRow = {
  id: string;
  email: string;
  fullName?: string;
  roles: string[];
};

type DeptWithCount = Department & { branchCount: number };

export default function Admin() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const [{ data: deps }, { data: us }] = await Promise.all([
        api.get<Department[]>("/user/departments"),
        api.get<UserRow[]>("/admin/users"),
      ]);
      setDepartments(deps);
      setUsers(us);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totalDepartments = departments.length;
  const totalBranches = useMemo(
    () => departments.reduce((acc, d) => acc + (d.branches?.length || 0), 0),
    [departments]
  );

  const roleCounts = useMemo(() => {
    const base = { Admin: 0, ServiceProvider: 0, User: 0, Other: 0 };
    for (const u of users) {
      if (!u.roles?.length) base.Other += 1;
      else {
        for (const r of u.roles) {
          if (r in base) (base as any)[r] += 1;
          else base.Other += 1;
        }
      }
    }
    return base;
  }, [users]);

  const topDepartments: DeptWithCount[] = useMemo(
    () =>
      departments
        .map<DeptWithCount>((d) => ({
          ...d,
          branchCount: d.branches?.length ?? 0,
        }))
        .sort((a, b) => b.branchCount - a.branchCount)
        .slice(0, 5),
    [departments]
  );

  const recentUsers = useMemo(() => users.slice(0, 8), [users]);

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
            Admin Özeti
          </h1>
          <p style={{ color: "#64748b" }}>
            Departmanlar, şubeler ve kullanıcılar için hızlı bir genel bakış
          </p>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            marginBottom: "24px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <button
              onClick={() => navigate("/admin/departments")}
              style={{
                background: "#2563eb",
                color: "white",
                fontWeight: 500,
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#1d4ed8")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
            >
              🏢 Departman Yönetimine Git
            </button>
            <button
              onClick={() => navigate("/admin/roles")}
              style={{
                background: "#f1f5f9",
                color: "#0f172a",
                fontWeight: 500,
                padding: "10px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#e2e8f0")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            >
              🧩 Kullanıcı Yönetimine Git
            </button>
          </div>
        </div>

        {loading && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Veriler yükleniyor...
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <Kpi
            icon="🏢"
            label="Departman"
            value={totalDepartments}
            hint="Toplam departman"
          />
          <Kpi
            icon="🏪"
            label="Şube"
            value={totalBranches}
            hint="Toplam şube"
          />
          <Kpi
            icon="👥"
            label="Kullanıcı"
            value={users.length}
            hint="Toplam kullanıcı"
          />
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "13px",
                color: "#64748b",
                marginBottom: "8px",
              }}
            >
              Rol Dağılımı
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <Badge label="Admin" value={roleCounts.Admin} tone="indigo" />
              <Badge
                label="ServiceProvider"
                value={roleCounts.ServiceProvider}
                tone="indigo"
              />
              <Badge label="User" value={roleCounts.User} tone="indigo" />
              {roleCounts.Other > 0 && (
                <Badge label="Diğer/Yok" value={roleCounts.Other} tone="rose" />
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #f1f5f9",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1e293b",
                  margin: 0,
                }}
              >
                🗂️ Departmanlar & Şubeler
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: "#dcfce7",
                  color: "#166534",
                }}
              >
                {totalBranches} şube
              </span>
            </div>

            {departments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 20px",
                  color: "#94a3b8",
                  background: "white",
                }}
              >
                Henüz departman bulunmuyor.
              </div>
            ) : (
              <div>
                {departments.map((d, index) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "14px 20px",
                      borderBottom:
                        index < departments.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                      transition: "background 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "white")
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          color: "#0f172a",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        🏢 {d.name}
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 500,
                          background: "#e2e8f0",
                          color: "#334155",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {(d.branches || []).length} şube
                      </span>
                    </div>

                    {(d.branches?.length || 0) > 0 && (
                      <div
                        style={{
                          marginTop: "8px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {d.branches!.map((b) => (
                          <span
                            key={b.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 500,
                              background: "#eff6ff",
                              color: "#1d4ed8",
                            }}
                          >
                            📍 {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: "24px" }}>
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                }}
              >
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: 0,
                  }}
                >
                  ⭐ En Çok Şubeli Departmanlar
                </h2>
              </div>

              {topDepartments.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 20px",
                    color: "#94a3b8",
                    background: "white",
                  }}
                >
                  Gösterilecek veri yok.
                </div>
              ) : (
                <div>
                  {topDepartments.map((d, index) => (
                    <div
                      key={d.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 20px",
                        borderBottom:
                          index < topDepartments.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                      }}
                    >
                      <div
                        style={{
                          color: "#0f172a",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}. {d.name}
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: 500,
                          background: "#e0e7ff",
                          color: "#3730a3",
                        }}
                      >
                        {d.branchCount} şube
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                }}
              >
                <h2
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#1e293b",
                    margin: 0,
                  }}
                >
                  👥 Kullanıcılar (Özet)
                </h2>
              </div>

              {recentUsers.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "24px 20px",
                    color: "#94a3b8",
                    background: "white",
                  }}
                >
                  Henüz kullanıcı yok.
                </div>
              ) : (
                <div>
                  {recentUsers.map((u, index) => (
                    <div
                      key={u.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 20px",
                        borderBottom:
                          index < recentUsers.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                      }}
                    >
                      <div style={{ color: "#0f172a", fontSize: "14px" }}>
                        <div style={{ fontWeight: 600 }}>
                          {u.fullName || u.email}
                        </div>
                        <div style={{ color: "#64748b", fontSize: "13px" }}>
                          {u.email}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        {u.roles?.length ? (
                          u.roles.map((r) => (
                            <span
                              key={r}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                fontSize: "12px",
                                fontWeight: 500,
                                background: "#eff6ff",
                                color: "#1d4ed8",
                              }}
                            >
                              {r}
                            </span>
                          ))
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 500,
                              background: "#fee2e2",
                              color: "#991b1b",
                            }}
                          >
                            Rol yok
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            borderRadius: "8px",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Daha detaylı yönetim için yukarıdaki kısa yollardan ilgili sayfalara
          gidebilirsiniz.
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: string;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e2e8f0",
        padding: "16px",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ color: "#0f172a", fontSize: "22px", fontWeight: 700 }}>
        {value}
      </div>
      <div style={{ color: "#334155", fontWeight: 600, fontSize: "14px" }}>
        {label}
      </div>
      {hint && (
        <div style={{ color: "#64748b", fontSize: "12px", marginTop: "6px" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Badge({
  label,
  value,
  tone = "indigo",
}: {
  label: string;
  value: number;
  tone?: "indigo" | "rose";
}) {
  const tones = {
    indigo: { bg: "#e0e7ff", fg: "#3730a3" },
    rose: { bg: "#ffe4e6", fg: "#9f1239" },
  } as const;
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 600,
        background: t.bg,
        color: t.fg,
      }}
    >
      {label}
      <span
        style={{
          background: "white",
          color: "#0f172a",
          padding: "2px 8px",
          borderRadius: "9999px",
          border: "1px solid #e2e8f0",
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </span>
  );
}
