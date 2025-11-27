import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Button,
  Badge,
  EmptyState,
  Tabs,
  Input,
} from "../../components/common";
import { commonStyles, colors } from "../../styles/commonStyles";

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

  const tabs = [
    { id: "departments", label: "🏢 Departmanlar" },
    { id: "branches", label: "🏪 Şube Yönetimi" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Departman Yönetimi"
        subtitle="Departmanları ve şubeleri yönetin"
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId as "departments" | "branches");
          if (tabId === "departments") {
            navigate("/admin/departments");
          } else {
            navigate("/admin/departments/branches");
          }
        }}
      />

      <Card>
        {activeTab === "departments" && (
          <div>
            <Card
              style={{
                background: colors.gray[50],
                border: `1px solid ${colors.gray[200]}`,
                marginBottom: "24px",
              }}
            >
              <h2 style={commonStyles.cardSubheader}>➕ Yeni Departman Ekle</h2>
              <div
                style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
              >
                <Input
                  placeholder="Departman adı girin..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createDepartment()}
                  style={{ flex: 1, minWidth: "200px" }}
                />
                <Button
                  variant="primary"
                  onClick={createDepartment}
                  style={{ whiteSpace: "nowrap" }}
                >
                  ➕ Ekle
                </Button>
              </div>
            </Card>

            <div>
              <h2 style={commonStyles.cardSubheader}>📋 Mevcut Departmanlar</h2>

              {departments.length === 0 ? (
                <EmptyState message="Henüz departman eklenmemiş. Yukarıdaki formu kullanarak departman ekleyin." />
              ) : (
                <div
                  style={{
                    border: `1px solid ${colors.gray[200]}`,
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
                            ? `1px solid ${colors.gray[100]}`
                            : "none",
                        transition: "background 0.2s",
                        wordBreak: "break-word",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.gray[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: colors.gray[900],
                          fontSize: "clamp(14px, 2vw, 15px)",
                        }}
                      >
                        🏢 {d.name}
                      </span>
                      <Badge variant="primary">
                        {(d.branches || []).length} şube
                      </Badge>
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
              <label style={commonStyles.formLabel}>🏢 Departman Seçin</label>
              <select
                style={{ ...commonStyles.select, maxWidth: "400px" }}
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
              <div style={commonStyles.grid.twoColumn}>
                <Card>
                  <h2 style={commonStyles.cardSubheader}>🏪 Şubeler</h2>
                  {(() => {
                    const list =
                      departments.find((d) => d.id === selectedDept)
                        ?.branches || [];
                    if (!list.length) {
                      return (
                        <EmptyState message="Bu departmana ait şube bulunmuyor. Sağdaki formu kullanarak şube ekleyin." />
                      );
                    }
                    return (
                      <div
                        style={{
                          border: `1px solid ${colors.gray[200]}`,
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
                                  ? `1px solid ${colors.gray[100]}`
                                  : "none",
                              transition: "background 0.2s",
                              color: colors.gray[900],
                              fontSize: "clamp(12px, 2vw, 14px)",
                              wordBreak: "break-word",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = colors.gray[50];
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "white";
                            }}
                          >
                            📍 {b.name}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </Card>

                <Card
                  style={{
                    background: colors.gray[50],
                    border: `1px solid ${colors.gray[200]}`,
                  }}
                >
                  <h2 style={commonStyles.cardSubheader}>➕ Yeni Şube Ekle</h2>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <Input
                      placeholder="Şube adı girin..."
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && createBranch()
                      }
                    />
                    <Button
                      variant="primary"
                      onClick={createBranch}
                      disabled={!branchName.trim()}
                      fullWidth
                    >
                      ➕ Şube Ekle
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {!selectedDept && (
              <EmptyState message="Şube yönetimi için önce bir departman seçin" />
            )}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
