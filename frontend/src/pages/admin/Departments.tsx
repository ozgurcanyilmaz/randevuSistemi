import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

type Department = {
  id: number;
  name: string;
  branches?: { id: number; name: string }[];
};

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [selectedDept, setSelectedDept] = useState<number | "">("");
  const [activeTab, setActiveTab] = useState<"departments" | "branches">(
    "departments"
  );
  const location = useLocation();
  const navigate = useNavigate();

  async function load() {
    const { data } = await api.get<Department[]>("/user/departments");
    setDepartments(data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (location.pathname.endsWith("/branches")) setActiveTab("branches");
    else setActiveTab("departments");
  }, [location.pathname]);

  async function createDepartment() {
    if (!name.trim()) return;
    await api.post("/admin/departments", { name });
    setName("");
    await load();
  }

  async function createBranch() {
    if (!branchName.trim() || !selectedDept) return;
    await api.post(`/admin/departments/${selectedDept}/branches`, {
      name: branchName,
    });
    setBranchName("");
    await load();
  }

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
            Departman Yönetimi
          </h1>
          <p style={{ color: "#64748b" }}>Departmanları ve şubeleri yönetin</p>
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
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <button
              onClick={() => navigate("/admin/departments")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: "500",
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "departments" ? "#eff6ff" : "transparent",
                color: activeTab === "departments" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "departments" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              🏢 Departmanlar
            </button>
            <button
              onClick={() => navigate("/admin/departments/branches")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: "500",
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "branches" ? "#eff6ff" : "transparent",
                color: activeTab === "branches" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "branches" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              🏪 Şube Yönetimi
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
          {activeTab === "departments" && (
            <div>
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e293b",
                    marginBottom: "16px",
                  }}
                >
                  ➕ Yeni Departman Ekle
                </h2>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input
                    style={{
                      flex: 1,
                      padding: "10px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    placeholder="Departman adı girin..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && createDepartment()}
                  />
                  <button
                    style={{
                      background: "#2563eb",
                      color: "white",
                      fontWeight: "500",
                      padding: "10px 24px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s",
                      whiteSpace: "nowrap",
                    }}
                    onClick={createDepartment}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#1d4ed8")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "#2563eb")
                    }
                  >
                    ➕ Ekle
                  </button>
                </div>
              </div>

              <div>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1e293b",
                    marginBottom: "16px",
                  }}
                >
                  📋 Mevcut Departmanlar
                </h2>

                {departments.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 24px",
                      color: "#94a3b8",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    Henüz departman eklenmemiş. Yukarıdaki formu kullanarak
                    departman ekleyin.
                  </div>
                ) : (
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      overflow: "hidden",
                    }}
                  >
                    {departments.map((d, index) => (
                      <div
                        key={d.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px 20px",
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
                        <span
                          style={{
                            fontWeight: "600",
                            color: "#0f172a",
                            fontSize: "15px",
                          }}
                        >
                          🏢 {d.name}
                        </span>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 12px",
                            borderRadius: "9999px",
                            fontSize: "13px",
                            fontWeight: "500",
                            background: "#e0e7ff",
                            color: "#3730a3",
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
          )}

          {activeTab === "branches" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  🏢 Departman Seçin
                </label>
                <select
                  style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white",
                    cursor: "pointer",
                  }}
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(Number(e.target.value))}
                >
                  <option value="">Departman seçin</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDept && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "24px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#1e293b",
                        marginBottom: "16px",
                      }}
                    >
                      🏪 Şubeler
                    </h2>
                    {(() => {
                      const list =
                        departments.find((d) => d.id === selectedDept)
                          ?.branches || [];
                      if (!list.length) {
                        return (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "32px 20px",
                              color: "#94a3b8",
                              background: "#f8fafc",
                              borderRadius: "8px",
                              border: "1px dashed #cbd5e1",
                            }}
                          >
                            Bu departmana ait şube bulunmuyor. Sağdaki formu
                            kullanarak şube ekleyin.
                          </div>
                        );
                      }
                      return (
                        <div
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                        >
                          {list.map((b, index) => (
                            <div
                              key={b.id}
                              style={{
                                padding: "14px 20px",
                                borderBottom:
                                  index < list.length - 1
                                    ? "1px solid #f1f5f9"
                                    : "none",
                                transition: "background 0.2s",
                                color: "#0f172a",
                                fontSize: "14px",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.background = "#f8fafc")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.background = "white")
                              }
                            >
                              📍 {b.name}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div>
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
                          fontWeight: "600",
                          color: "#1e293b",
                          marginBottom: "16px",
                        }}
                      >
                        ➕ Yeni Şube Ekle
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <input
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            border: "1px solid #cbd5e1",
                            borderRadius: "8px",
                            fontSize: "14px",
                          }}
                          placeholder="Şube adı girin..."
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && createBranch()
                          }
                        />
                        <button
                          style={{
                            background: "#2563eb",
                            color: "white",
                            fontWeight: "500",
                            padding: "10px 24px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            transition: "all 0.2s",
                          }}
                          onClick={createBranch}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.background = "#1d4ed8")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.background = "#2563eb")
                          }
                        >
                          ➕ Şube Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!selectedDept && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 24px",
                    color: "#94a3b8",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px dashed #cbd5e1",
                  }}
                >
                  Şube yönetimi için önce bir departman seçin
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
