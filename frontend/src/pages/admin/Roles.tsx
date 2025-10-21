import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

type Department = {
  id: number;
  name: string;
  branches?: { id: number; name: string }[];
};

type UserRow = {
  id: string;
  email: string;
  fullName?: string;
  roles: string[];
};

export default function Roles() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [role, setRole] = useState("ServiceProvider");
  const [selectedBranch, setSelectedBranch] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<"assignRole" | "assignProvider">(
    "assignRole"
  );
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const [deps, us] = await Promise.all([
        api.get<Department[]>("/user/departments"),
        api.get<UserRow[]>("/admin/users"),
      ]);
      setDepartments(deps.data);
      setUsers(us.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (location.pathname.endsWith("/assign-provider"))
      setActiveTab("assignProvider");
    else setActiveTab("assignRole");
  }, [location.pathname]);

  async function assignRole() {
    if (!selectedUser) return;
    await api.post("/admin/assign-role", { userId: selectedUser, role });
    await load();
  }

  async function assignProvider() {
    if (!selectedUser || !selectedBranch) return;
    await api.post("/admin/assign-provider", {
      userId: selectedUser,
      branchId: selectedBranch,
    });
    setSelectedBranch("");
    await load();
  }

  const providerUsers = users.filter((u) =>
    u.roles.includes("ServiceProvider")
  );

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
            Kullanıcı & Rol Yönetimi
          </h1>
          <p style={{ color: "#64748b" }}>
            Kullanıcı rolleri ve şube atamalarını yönetin
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
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
            <button
              onClick={() => navigate("/admin/roles")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "assignRole" ? "#eff6ff" : "transparent",
                color: activeTab === "assignRole" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "assignRole" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              🧩 Rol Atama
            </button>
            <button
              onClick={() => navigate("/admin/roles/assign-provider")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "assignProvider" ? "#eff6ff" : "transparent",
                color: activeTab === "assignProvider" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "assignProvider" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              🏪 İlgiliyi Şubeye Atama
            </button>
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

          {activeTab === "assignRole" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "16px",
                  }}
                >
                  ➕ Rol Ata
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      👤 Kullanıcı Seçin
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "white",
                        cursor: "pointer",
                      }}
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">Kullanıcı seçin</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {(u.fullName || u.email) + " "}
                          {u.roles.length
                            ? ` [${u.roles.join(", ")}]`
                            : " [rol yok]"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      🧩 Rol
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <select
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "14px",
                          background: "white",
                          cursor: "pointer",
                        }}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                      >
                        <option value="Admin">Admin</option>
                        <option value="ServiceProvider">ServiceProvider</option>
                        <option value="User">User</option>
                      </select>
                      <button
                        style={{
                          background: selectedUser ? "#2563eb" : "#94a3b8",
                          color: "white",
                          fontWeight: 500,
                          padding: "10px 24px",
                          border: "none",
                          borderRadius: "8px",
                          cursor: selectedUser ? "pointer" : "not-allowed",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          whiteSpace: "nowrap",
                        }}
                        disabled={!selectedUser}
                        onClick={assignRole}
                        onMouseOver={(e) => {
                          if (selectedUser)
                            e.currentTarget.style.background = "#1d4ed8";
                        }}
                        onMouseOut={(e) => {
                          if (selectedUser)
                            e.currentTarget.style.background = "#2563eb";
                        }}
                      >
                        ➕ Ata
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
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
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    📋 Kullanıcılar ({users.length})
                  </h3>
                </div>

                {users.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 20px",
                      color: "#94a3b8",
                      background: "white",
                    }}
                  >
                    Henüz kullanıcı bulunmuyor.
                  </div>
                ) : (
                  <div>
                    {users.map((u, index) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedUser(u.id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 20px",
                          borderBottom:
                            index < users.length - 1
                              ? "1px solid #f1f5f9"
                              : "none",
                          transition: "background 0.2s",
                          cursor: "pointer",
                          background:
                            selectedUser === u.id ? "#eff6ff" : "white",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.background = "#f8fafc")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.background =
                            selectedUser === u.id ? "#eff6ff" : "white")
                        }
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
                          {u.roles.length ? (
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
                                  background: "#e0e7ff",
                                  color: "#3730a3",
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
          )}

          {activeTab === "assignProvider" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
              }}
            >
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: "16px",
                  }}
                >
                  ➕ İlgiliyi Şubeye Ata
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      👤 İlgili Seçin
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        fontSize: "14px",
                        background: "white",
                        cursor: "pointer",
                      }}
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">İlgili seçin</option>
                      {providerUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName || u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      🏪 Şube Seçin
                    </label>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <select
                        style={{
                          flex: 1,
                          padding: "10px 16px",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          fontSize: "14px",
                          background: "white",
                          cursor: "pointer",
                        }}
                        value={selectedBranch}
                        onChange={(e) =>
                          setSelectedBranch(Number(e.target.value))
                        }
                      >
                        <option value="">Şube seçin</option>
                        {departments.flatMap((d) =>
                          (d.branches || []).map((b) => (
                            <option key={b.id} value={b.id}>
                              {d.name} - {b.name}
                            </option>
                          ))
                        )}
                      </select>
                      <button
                        style={{
                          background:
                            selectedUser && selectedBranch
                              ? "#2563eb"
                              : "#94a3b8",
                          color: "white",
                          fontWeight: 500,
                          padding: "10px 24px",
                          border: "none",
                          borderRadius: "8px",
                          cursor:
                            selectedUser && selectedBranch
                              ? "pointer"
                              : "not-allowed",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          whiteSpace: "nowrap",
                        }}
                        disabled={!selectedUser || !selectedBranch}
                        onClick={assignProvider}
                        onMouseOver={(e) => {
                          if (selectedUser && selectedBranch)
                            e.currentTarget.style.background = "#1d4ed8";
                        }}
                        onMouseOut={(e) => {
                          if (selectedUser && selectedBranch)
                            e.currentTarget.style.background = "#2563eb";
                        }}
                      >
                        ➕ Ata
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "24px" }}>
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
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
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1e293b",
                        margin: 0,
                      }}
                    >
                      👥 İlgililer ({providerUsers.length})
                    </h3>
                  </div>
                  {providerUsers.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "32px 20px",
                        color: "#94a3b8",
                        background: "white",
                      }}
                    >
                      Henüz ServiceProvider rolünde kullanıcı yok.
                    </div>
                  ) : (
                    <div>
                      {providerUsers.map((u, index) => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUser(u.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "14px 20px",
                            borderBottom:
                              index < providerUsers.length - 1
                                ? "1px solid #f1f5f9"
                                : "none",
                            transition: "background 0.2s",
                            cursor: "pointer",
                            background:
                              selectedUser === u.id ? "#eff6ff" : "white",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#f8fafc")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background =
                              selectedUser === u.id ? "#eff6ff" : "white")
                          }
                        >
                          <div style={{ color: "#0f172a", fontSize: "14px" }}>
                            <div style={{ fontWeight: 600 }}>
                              {u.fullName || u.email}
                            </div>
                            <div style={{ color: "#64748b", fontSize: "13px" }}>
                              {u.email}
                            </div>
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
                            Provider
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#1e293b",
                        margin: 0,
                      }}
                    >
                      🏢 Departman & Şube Özeti
                    </h3>
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
                      {departments.reduce(
                        (acc, d) => acc + (d.branches?.length || 0),
                        0
                      )}{" "}
                      şube
                    </span>
                  </div>
                  {departments.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "20px",
                        color: "#94a3b8",
                        background: "white",
                        border: "1px dashed #cbd5e1",
                        borderRadius: "8px",
                      }}
                    >
                      Departman bulunamadı. Şube atamak için önce departman/şube
                      oluşturun.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: "8px" }}>
                      {departments.map((d) => (
                        <div
                          key={d.id}
                          style={{ color: "#334155", fontSize: "14px" }}
                        >
                          <strong style={{ color: "#0f172a" }}>{d.name}</strong>{" "}
                          <span
                            style={{
                              marginLeft: "8px",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              background: "#e2e8f0",
                              color: "#334155",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {(d.branches || []).length} şube
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "assignProvider" &&
            !selectedUser &&
            providerUsers.length > 0 && (
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
                Şube atamak için soldaki listeden bir ilgili seçin ve ardından
                şube seçin.
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
