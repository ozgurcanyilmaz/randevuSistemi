import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Button,
  Badge,
  Loading,
  EmptyState,
  Tabs,
} from "../../components/common";
import { commonStyles, colors } from "../../styles/commonStyles";

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
  const [role, setRole] = useState("Operator");
  const [selectedBranch, setSelectedBranch] = useState<number | "">("");
  const [selectedOperatorBranch, setSelectedOperatorBranch] = useState<number | "">("");
  const [selectedOperatorUser, setSelectedOperatorUser] = useState("");
  const [activeTab, setActiveTab] = useState<"assignRole" | "assignProvider" | "assignOperator">(
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
    else if (location.pathname.endsWith("/assign-operator"))
      setActiveTab("assignOperator");
    else setActiveTab("assignRole");
  }, [location.pathname]);

  async function assignRole() {
    if (!selectedUser) return;
    await api.post("/admin/assign-role", { userId: selectedUser, role });
    setSelectedUser("");
    await load();
  }

  async function assignProvider() {
    if (!selectedUser || !selectedBranch) return;
    await api.post("/admin/assign-provider", {
      userId: selectedUser,
      branchId: selectedBranch,
    });
    setSelectedBranch("");
    setSelectedUser("");
    await load();
  }

  async function assignOperator() {
    if (!selectedOperatorUser || !selectedOperatorBranch) return;
    await api.post("/admin/assign-operator", {
      userId: selectedOperatorUser,
      branchId: selectedOperatorBranch,
    });
    setSelectedOperatorBranch("");
    setSelectedOperatorUser("");
    await load();
  }

  const providerUsers = users.filter((u) =>
    u.roles.includes("ServiceProvider")
  );

  const operatorUsers = users.filter((u) =>
    u.roles.includes("Operator")
  );

  const allBranches = departments.flatMap((d) =>
    (d.branches || []).map((b) => ({ ...b, depName: d.name }))
  );

  const tabs = [
    { id: "assignRole", label: "🧩 Rol Atama" },
    { id: "assignProvider", label: "🏪 İlgiliyi Şubeye Atama" },
    { id: "assignOperator", label: "👨‍💼 Operatörü Şubeye Atama" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Kullanıcı & Rol Yönetimi"
        subtitle="Kullanıcı rolleri ve şube atamalarını yönetin"
      />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId as "assignRole" | "assignProvider" | "assignOperator");
          if (tabId === "assignRole") {
            navigate("/admin/roles");
          } else if (tabId === "assignProvider") {
            navigate("/admin/roles/assign-provider");
          } else if (tabId === "assignOperator") {
            navigate("/admin/roles/assign-operator");
          }
        }}
      />

      <Card>
        {loading && <Loading message="Veriler yükleniyor..." />}

        {activeTab === "assignRole" && (
          <div style={commonStyles.grid.twoColumn}>
            <Card
              style={{
                background: colors.gray[50],
                border: `1px solid ${colors.gray[200]}`,
              }}
            >
              <h2 style={commonStyles.cardSubheader}>➕ Rol Ata</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={commonStyles.formLabel}>👤 Kullanıcı Seçin</label>
                  <select
                    style={commonStyles.select}
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
                  <label style={commonStyles.formLabel}>🧩 Rol</label>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <select
                      style={{ ...commonStyles.select, flex: 1, minWidth: "150px" }}
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Operator">Operator</option>
                      <option value="ServiceProvider">ServiceProvider</option>
                      <option value="User">User</option>
                    </select>
                    <Button
                      variant="primary"
                      onClick={assignRole}
                      disabled={!selectedUser}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      ➕ Ata
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3
                style={{
                  fontSize: "clamp(14px, 2vw, 16px)",
                  fontWeight: 600,
                  color: colors.gray[900],
                  margin: 0,
                  marginBottom: "16px",
                }}
              >
                📋 Kullanıcılar ({users.length})
              </h3>

              {users.length === 0 ? (
                <EmptyState message="Henüz kullanıcı bulunmuyor." />
              ) : (
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
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
                            ? `1px solid ${colors.gray[100]}`
                            : "none",
                        transition: "background 0.2s",
                        cursor: "pointer",
                        background:
                          selectedUser === u.id ? colors.primary[50] : "white",
                        wordBreak: "break-word",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.gray[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          selectedUser === u.id ? colors.primary[50] : "white";
                      }}
                    >
                      <div
                        style={{
                          color: colors.gray[900],
                          fontSize: "clamp(12px, 2vw, 14px)",
                          flex: 1,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {u.fullName || u.email}
                        </div>
                        <div
                          style={{
                            color: colors.gray[500],
                            fontSize: "clamp(11px, 1.5vw, 13px)",
                          }}
                        >
                          {u.email}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "6px",
                          flexWrap: "wrap",
                          marginLeft: "12px",
                        }}
                      >
                        {u.roles.length ? (
                          u.roles.map((r) => (
                            <Badge key={r} variant="primary">
                              {r}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="error">Rol yok</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "assignProvider" && (
          <div style={commonStyles.grid.twoColumn}>
            <Card
              style={{
                background: colors.gray[50],
                border: `1px solid ${colors.gray[200]}`,
              }}
            >
              <h2 style={commonStyles.cardSubheader}>➕ İlgiliyi Şubeye Ata</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={commonStyles.formLabel}>👤 İlgili Seçin</label>
                  <select
                    style={commonStyles.select}
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
                  <label style={commonStyles.formLabel}>🏪 Şube Seçin</label>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <select
                      style={{ ...commonStyles.select, flex: 1, minWidth: "150px" }}
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(Number(e.target.value))}
                    >
                      <option value="">Şube seçin</option>
                      {allBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.depName} - {b.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      onClick={assignProvider}
                      disabled={!selectedUser || !selectedBranch}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      ➕ Ata
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div style={{ display: "grid", gap: "24px" }}>
              <Card>
                <h3
                  style={{
                    fontSize: "clamp(14px, 2vw, 16px)",
                    fontWeight: 600,
                    color: colors.gray[900],
                    margin: 0,
                    marginBottom: "16px",
                  }}
                >
                  👥 İlgililer ({providerUsers.length})
                </h3>
                {providerUsers.length === 0 ? (
                  <EmptyState message="Henüz ServiceProvider rolünde kullanıcı yok." />
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
                              ? `1px solid ${colors.gray[100]}`
                              : "none",
                          transition: "background 0.2s",
                          cursor: "pointer",
                          background:
                            selectedUser === u.id ? colors.primary[50] : "white",
                          wordBreak: "break-word",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.gray[50];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            selectedUser === u.id ? colors.primary[50] : "white";
                        }}
                      >
                        <div
                          style={{
                            color: colors.gray[900],
                            fontSize: "clamp(12px, 2vw, 14px)",
                            flex: 1,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {u.fullName || u.email}
                          </div>
                          <div
                            style={{
                              color: colors.gray[500],
                              fontSize: "clamp(11px, 1.5vw, 13px)",
                            }}
                          >
                            {u.email}
                          </div>
                        </div>
                        <Badge variant="primary" style={{ marginLeft: "12px" }}>
                          Provider
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card
                style={{
                  background: colors.gray[50],
                  border: `1px solid ${colors.gray[200]}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "clamp(14px, 2vw, 16px)",
                      fontWeight: 600,
                      color: colors.gray[900],
                      margin: 0,
                    }}
                  >
                    🏢 Departman & Şube Özeti
                  </h3>
                  <Badge variant="success">
                    {departments.reduce(
                      (acc, d) => acc + (d.branches?.length || 0),
                      0
                    )}{" "}
                    şube
                  </Badge>
                </div>
                {departments.length === 0 ? (
                  <EmptyState message="Departman bulunamadı. Şube atamak için önce departman/şube oluşturun." />
                ) : (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {departments.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          color: colors.gray[700],
                          fontSize: "clamp(12px, 2vw, 14px)",
                          wordBreak: "break-word",
                        }}
                      >
                        <strong style={{ color: colors.gray[900] }}>
                          {d.name}
                        </strong>{" "}
                        <Badge variant="gray" style={{ marginLeft: "8px" }}>
                          {(d.branches || []).length} şube
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
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
                background: colors.gray[50],
                border: `1px dashed ${colors.gray[300]}`,
                borderRadius: "8px",
                color: colors.gray[500],
                fontSize: "clamp(12px, 2vw, 14px)",
                wordBreak: "break-word",
              }}
            >
              Şube atamak için soldaki listeden bir ilgili seçin ve ardından şube
              seçin.
            </div>
          )}

        {activeTab === "assignOperator" && (
          <div style={commonStyles.grid.twoColumn}>
            <Card
              style={{
                background: colors.gray[50],
                border: `1px solid ${colors.gray[200]}`,
              }}
            >
              <h2 style={commonStyles.cardSubheader}>➕ Operatörü Şubeye Ata</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={commonStyles.formLabel}>👤 Operatör Seçin</label>
                  <select
                    style={commonStyles.select}
                    value={selectedOperatorUser}
                    onChange={(e) => setSelectedOperatorUser(e.target.value)}
                  >
                    <option value="">Operatör seçin</option>
                    {operatorUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={commonStyles.formLabel}>🏪 Şube Seçin</label>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <select
                      style={{ ...commonStyles.select, flex: 1, minWidth: "150px" }}
                      value={selectedOperatorBranch}
                      onChange={(e) => setSelectedOperatorBranch(Number(e.target.value))}
                    >
                      <option value="">Şube seçin</option>
                      {allBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.depName} - {b.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      onClick={assignOperator}
                      disabled={!selectedOperatorUser || !selectedOperatorBranch}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      ➕ Ata
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <div style={{ display: "grid", gap: "24px" }}>
              <Card>
                <h3
                  style={{
                    fontSize: "clamp(14px, 2vw, 16px)",
                    fontWeight: 600,
                    color: colors.gray[900],
                    margin: 0,
                    marginBottom: "16px",
                  }}
                >
                  👨‍💼 Operatörler ({operatorUsers.length})
                </h3>
                {operatorUsers.length === 0 ? (
                  <EmptyState message="Henüz Operator rolünde kullanıcı yok." />
                ) : (
                  <div>
                    {operatorUsers.map((u, index) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedOperatorUser(u.id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "14px 20px",
                          borderBottom:
                            index < operatorUsers.length - 1
                              ? `1px solid ${colors.gray[100]}`
                              : "none",
                          transition: "background 0.2s",
                          cursor: "pointer",
                          background:
                            selectedOperatorUser === u.id ? colors.primary[50] : "white",
                          wordBreak: "break-word",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.gray[50];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            selectedOperatorUser === u.id ? colors.primary[50] : "white";
                        }}
                      >
                        <div
                          style={{
                            color: colors.gray[900],
                            fontSize: "clamp(12px, 2vw, 14px)",
                            flex: 1,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {u.fullName || u.email}
                          </div>
                          <div
                            style={{
                              color: colors.gray[500],
                              fontSize: "clamp(11px, 1.5vw, 13px)",
                            }}
                          >
                            {u.email}
                          </div>
                        </div>
                        <Badge variant="primary" style={{ marginLeft: "12px" }}>
                          Operator
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card
                style={{
                  background: colors.gray[50],
                  border: `1px solid ${colors.gray[200]}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "clamp(14px, 2vw, 16px)",
                      fontWeight: 600,
                      color: colors.gray[900],
                      margin: 0,
                    }}
                  >
                    🏢 Departman & Şube Özeti
                  </h3>
                  <Badge variant="success">
                    {departments.reduce(
                      (acc, d) => acc + (d.branches?.length || 0),
                      0
                    )}{" "}
                    şube
                  </Badge>
                </div>
                {departments.length === 0 ? (
                  <EmptyState message="Departman bulunamadı. Şube atamak için önce departman/şube oluşturun." />
                ) : (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {departments.map((d) => (
                      <div
                        key={d.id}
                        style={{
                          color: colors.gray[700],
                          fontSize: "clamp(12px, 2vw, 14px)",
                          wordBreak: "break-word",
                        }}
                      >
                        <strong style={{ color: colors.gray[900] }}>
                          {d.name}
                        </strong>{" "}
                        <Badge variant="gray" style={{ marginLeft: "8px" }}>
                          {(d.branches || []).length} şube
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {activeTab === "assignOperator" &&
          !selectedOperatorUser &&
          operatorUsers.length > 0 && (
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: colors.gray[50],
                border: `1px dashed ${colors.gray[300]}`,
                borderRadius: "8px",
                color: colors.gray[500],
                fontSize: "clamp(12px, 2vw, 14px)",
                wordBreak: "break-word",
              }}
            >
              Şube atamak için soldaki listeden bir operatör seçin ve ardından şube
              seçin.
            </div>
          )}
      </Card>
    </PageContainer>
  );
}
