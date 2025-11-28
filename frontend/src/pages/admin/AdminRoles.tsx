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
  Input,
  Modal,
} from "../../components/common";
import { SuccessModal } from "../../components/common/SuccessModal";
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
  
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [providerSearchQuery, setProviderSearchQuery] = useState("");
  const [operatorSearchQuery, setOperatorSearchQuery] = useState("");
  const [branchSearchQuery, setBranchSearchQuery] = useState("");
  const [operatorBranchSearchQuery, setOperatorBranchSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"assignRole" | "assignProvider" | "assignOperator" | "userOperations">(
    "assignRole"
  );
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserRow[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | "">("");
  const [selectedBranchForFilter, setSelectedBranchForFilter] = useState<number | "">("");
  const [userDetails, setUserDetails] = useState<{
    id: string;
    email: string;
    fullName?: string;
    roles: string[];
    branch?: {
      id: number;
      name: string;
      department: { id: number; name: string };
    } | null;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<string>("");
  const [newRole, setNewRole] = useState("User");
  const [newBranch, setNewBranch] = useState<number | "">("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
      setFilteredUsers(us.data);
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers() {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery.trim()) {
        params.query = searchQuery;
      }
      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }
      if (selectedBranchForFilter) {
        params.branchId = selectedBranchForFilter;
      }
      const { data } = await api.get<UserRow[]>("/admin/users/search", { params });
      const nonAdminUsers = data.filter(u => !u.roles.includes("Admin"));
      setFilteredUsers(nonAdminUsers);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "userOperations") {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, activeTab, selectedDepartment, selectedBranchForFilter]);

  async function loadUserDetails(userId: string) {
    try {
      const { data } = await api.get<{
        id: string;
        email: string;
        fullName?: string;
        roles: string[];
        branch?: {
          id: number;
          name: string;
          department: { id: number; name: string };
        } | null;
      }>(`/admin/users/${userId}/details`);
      setUserDetails(data);
      return data;
    } catch (error) {
      console.error("Load user details error:", error);
      return null;
    }
  }

  async function handleDeleteUser() {
    if (!selectedUserForAction) return;
    try {
      await api.delete(`/admin/users/${selectedUserForAction}`);
      setShowDeleteModal(false);
      setSelectedUserForAction("");
      setSuccessMessage("Kullanıcı başarıyla silindi.");
      setShowSuccessModal(true);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || "Kullanıcı silinirken bir hata oluştu.");
    }
  }

  async function handleUpdateRole() {
    if (!selectedUserForAction) return;
    try {
      await api.put(`/admin/users/${selectedUserForAction}/role`, { role: newRole });
      setShowRoleModal(false);
      setSelectedUserForAction("");
      setSuccessMessage("Kullanıcı rolü başarıyla güncellendi.");
      setShowSuccessModal(true);
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || "Rol güncellenirken bir hata oluştu.");
    }
  }

  async function handleUpdateBranch() {
    if (!selectedUserForAction || !newBranch) return;
    try {
      await api.put(`/admin/users/${selectedUserForAction}/branch`, { branchId: newBranch });
      setShowBranchModal(false);
      setSelectedUserForAction("");
      setNewBranch("");
      setSuccessMessage("Kullanıcı şubesi başarıyla güncellendi.");
      setShowSuccessModal(true);
      await load();
      if (userDetails?.id === selectedUserForAction) {
        await loadUserDetails(selectedUserForAction);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Şube güncellenirken bir hata oluştu.");
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
    else if (location.pathname.endsWith("/user-operations"))
      setActiveTab("userOperations");
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

  const filteredUsersForRole = users.filter((u) => {
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      return (
        (u.fullName?.toLowerCase().includes(query) || false) ||
        (u.email?.toLowerCase().includes(query) || false)
      );
    }
    return true;
  });

  const filteredProviderUsers = providerUsers.filter((u) => {
    if (providerSearchQuery.trim()) {
      const query = providerSearchQuery.toLowerCase();
      return (
        (u.fullName?.toLowerCase().includes(query) || false) ||
        (u.email?.toLowerCase().includes(query) || false)
      );
    }
    return true;
  });

  const filteredOperatorUsers = operatorUsers.filter((u) => {
    if (operatorSearchQuery.trim()) {
      const query = operatorSearchQuery.toLowerCase();
      return (
        (u.fullName?.toLowerCase().includes(query) || false) ||
        (u.email?.toLowerCase().includes(query) || false)
      );
    }
    return true;
  });

  const filteredBranches = allBranches.filter((b) => {
    if (branchSearchQuery.trim()) {
      const query = branchSearchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(query) ||
        b.depName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filteredOperatorBranches = allBranches.filter((b) => {
    if (operatorBranchSearchQuery.trim()) {
      const query = operatorBranchSearchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(query) ||
        b.depName.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const tabs = [
    { id: "userOperations", label: "👥 Kullanıcı İşlemleri" },
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
          setActiveTab(tabId as "assignRole" | "assignProvider" | "assignOperator" | "userOperations");
          if (tabId === "assignRole") {
            navigate("/admin/roles");
          } else if (tabId === "assignProvider") {
            navigate("/admin/roles/assign-provider");
          } else if (tabId === "assignOperator") {
            navigate("/admin/roles/assign-operator");
          } else if (tabId === "userOperations") {
            navigate("/admin/roles/user-operations");
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
                  <Input
                    placeholder="Kullanıcı ara..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      background: "white",
                    }}
                  >
                    {filteredUsersForRole.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", color: colors.gray[500] }}>
                        Kullanıcı bulunamadı
                      </div>
                    ) : (
                      filteredUsersForRole.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u.id);
                            setUserSearchQuery("");
                          }}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${colors.gray[100]}`,
                            background: selectedUser === u.id ? colors.primary[50] : "white",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedUser !== u.id) {
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedUser === u.id ? colors.primary[50] : "white";
                          }}
                        >
                          <div style={{ fontWeight: 600, color: colors.gray[900], fontSize: "14px" }}>
                            {u.fullName || u.email}
                          </div>
                          <div style={{ fontSize: "12px", color: colors.gray[500], marginTop: "4px" }}>
                            {u.email}
                          </div>
                          <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                            {u.roles.length ? (
                              u.roles.map((r) => (
                                <Badge key={r} variant="primary" style={{ fontSize: "10px" }}>
                                  {r}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="error" style={{ fontSize: "10px" }}>Rol yok</Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedUser && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px 12px",
                        background: colors.primary[50],
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: colors.primary[800],
                      }}
                    >
                      ✓ Seçili: {users.find((u) => u.id === selectedUser)?.fullName || users.find((u) => u.id === selectedUser)?.email}
                    </div>
                  )}
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

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={commonStyles.formLabel}>👤 İlgili Seçin</label>
                  <Input
                    placeholder="İlgili ara..."
                    value={providerSearchQuery}
                    onChange={(e) => setProviderSearchQuery(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      background: "white",
                    }}
                  >
                    {filteredProviderUsers.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", color: colors.gray[500] }}>
                        İlgili bulunamadı
                      </div>
                    ) : (
                      filteredProviderUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u.id);
                            setProviderSearchQuery("");
                          }}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${colors.gray[100]}`,
                            background: selectedUser === u.id ? colors.primary[50] : "white",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedUser !== u.id) {
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedUser === u.id ? colors.primary[50] : "white";
                          }}
                        >
                          <div style={{ fontWeight: 600, color: colors.gray[900], fontSize: "14px" }}>
                            {u.fullName || u.email}
                          </div>
                          <div style={{ fontSize: "12px", color: colors.gray[500], marginTop: "4px" }}>
                            {u.email}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedUser && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px 12px",
                        background: colors.primary[50],
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: colors.primary[800],
                      }}
                    >
                      ✓ Seçili: {providerUsers.find((u) => u.id === selectedUser)?.fullName || providerUsers.find((u) => u.id === selectedUser)?.email}
                    </div>
                  )}
                </div>

                <div>
                  <label style={commonStyles.formLabel}>🏪 Şube Seçin</label>
                  <Input
                    placeholder="Şube ara..."
                    value={branchSearchQuery}
                    onChange={(e) => setBranchSearchQuery(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      background: "white",
                    }}
                  >
                    {filteredBranches.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", color: colors.gray[500] }}>
                        Şube bulunamadı
                      </div>
                    ) : (
                      filteredBranches.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedBranch(b.id);
                            setBranchSearchQuery("");
                          }}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${colors.gray[100]}`,
                            background: selectedBranch === b.id ? colors.primary[50] : "white",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedBranch !== b.id) {
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedBranch === b.id ? colors.primary[50] : "white";
                          }}
                        >
                          <div style={{ fontWeight: 600, color: colors.gray[900], fontSize: "14px" }}>
                            {b.name}
                          </div>
                          <div style={{ fontSize: "12px", color: colors.gray[500], marginTop: "4px" }}>
                            {b.depName}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedBranch && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px 12px",
                        background: colors.primary[50],
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: colors.primary[800],
                      }}
                    >
                      ✓ Seçili: {allBranches.find((b) => b.id === selectedBranch)?.depName} - {allBranches.find((b) => b.id === selectedBranch)?.name}
                    </div>
                  )}
                  <Button
                    variant="primary"
                    onClick={assignProvider}
                    disabled={!selectedUser || !selectedBranch}
                    style={{ marginTop: "12px", width: "100%" }}
                  >
                    ➕ Ata
                  </Button>
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

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={commonStyles.formLabel}>👤 Operatör Seçin</label>
                  <Input
                    placeholder="Operatör ara..."
                    value={operatorSearchQuery}
                    onChange={(e) => setOperatorSearchQuery(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      background: "white",
                    }}
                  >
                    {filteredOperatorUsers.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", color: colors.gray[500] }}>
                        Operatör bulunamadı
                      </div>
                    ) : (
                      filteredOperatorUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedOperatorUser(u.id);
                            setOperatorSearchQuery("");
                          }}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${colors.gray[100]}`,
                            background: selectedOperatorUser === u.id ? colors.primary[50] : "white",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedOperatorUser !== u.id) {
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedOperatorUser === u.id ? colors.primary[50] : "white";
                          }}
                        >
                          <div style={{ fontWeight: 600, color: colors.gray[900], fontSize: "14px" }}>
                            {u.fullName || u.email}
                          </div>
                          <div style={{ fontSize: "12px", color: colors.gray[500], marginTop: "4px" }}>
                            {u.email}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedOperatorUser && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px 12px",
                        background: colors.primary[50],
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: colors.primary[800],
                      }}
                    >
                      ✓ Seçili: {operatorUsers.find((u) => u.id === selectedOperatorUser)?.fullName || operatorUsers.find((u) => u.id === selectedOperatorUser)?.email}
                    </div>
                  )}
                </div>

                <div>
                  <label style={commonStyles.formLabel}>🏪 Şube Seçin</label>
                  <Input
                    placeholder="Şube ara..."
                    value={operatorBranchSearchQuery}
                    onChange={(e) => setOperatorBranchSearchQuery(e.target.value)}
                    style={{ marginBottom: "8px" }}
                  />
                  <div
                    style={{
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: "8px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      background: "white",
                    }}
                  >
                    {filteredOperatorBranches.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", color: colors.gray[500] }}>
                        Şube bulunamadı
                      </div>
                    ) : (
                      filteredOperatorBranches.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedOperatorBranch(b.id);
                            setOperatorBranchSearchQuery("");
                          }}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: `1px solid ${colors.gray[100]}`,
                            background: selectedOperatorBranch === b.id ? colors.primary[50] : "white",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (selectedOperatorBranch !== b.id) {
                              e.currentTarget.style.background = colors.gray[50];
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              selectedOperatorBranch === b.id ? colors.primary[50] : "white";
                          }}
                        >
                          <div style={{ fontWeight: 600, color: colors.gray[900], fontSize: "14px" }}>
                            {b.name}
                          </div>
                          <div style={{ fontSize: "12px", color: colors.gray[500], marginTop: "4px" }}>
                            {b.depName}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedOperatorBranch && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px 12px",
                        background: colors.primary[50],
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: colors.primary[800],
                      }}
                    >
                      ✓ Seçili: {allBranches.find((b) => b.id === selectedOperatorBranch)?.depName} - {allBranches.find((b) => b.id === selectedOperatorBranch)?.name}
                    </div>
                  )}
                  <Button
                    variant="primary"
                    onClick={assignOperator}
                    disabled={!selectedOperatorUser || !selectedOperatorBranch}
                    style={{ marginTop: "12px", width: "100%" }}
                  >
                    ➕ Ata
                  </Button>
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

        {activeTab === "userOperations" && (
          <div>
            <Card
              style={{
                background: colors.gray[50],
                border: `1px solid ${colors.gray[200]}`,
                marginBottom: "24px",
              }}
            >
              <h2 style={commonStyles.cardSubheader}>🔍 Kullanıcı Filtrele</h2>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={commonStyles.formLabel}>🔍 İsim veya E-posta</label>
                  <Input
                    placeholder="Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={commonStyles.formLabel}>🏢 Departman</label>
                  <select
                    style={commonStyles.select}
                    value={selectedDepartment}
                    onChange={(e) => {
                      setSelectedDepartment(e.target.value ? Number(e.target.value) : "");
                      setSelectedBranchForFilter("");
                    }}
                  >
                    <option value="">Tüm Departmanlar</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <label style={commonStyles.formLabel}>🏪 Şube</label>
                  <select
                    style={commonStyles.select}
                    value={selectedBranchForFilter}
                    onChange={(e) => setSelectedBranchForFilter(e.target.value ? Number(e.target.value) : "")}
                    disabled={!selectedDepartment}
                  >
                    <option value="">Tüm Şubeler</option>
                    {selectedDepartment &&
                      departments
                        .find((d) => d.id === selectedDepartment)
                        ?.branches?.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                  </select>
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
                👥 Kullanıcılar ({filteredUsers.length})
              </h3>

              {loading && <Loading message="Aranıyor..." />}

              {!loading && filteredUsers.length === 0 ? (
                <EmptyState message="Kullanıcı bulunamadı." />
              ) : (
                <div style={{ maxHeight: "600px", overflowY: "auto" }}>
                  {filteredUsers.map((u, index) => (
                    <div
                      key={u.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px 20px",
                        borderBottom:
                          index < filteredUsers.length - 1
                            ? `1px solid ${colors.gray[100]}`
                            : "none",
                        transition: "background 0.2s",
                        wordBreak: "break-word",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.gray[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div
                          style={{
                            color: colors.gray[900],
                            fontSize: "clamp(13px, 2vw, 15px)",
                            fontWeight: 600,
                            marginBottom: "4px",
                          }}
                        >
                          {u.fullName || u.email}
                        </div>
                        <div
                          style={{
                            color: colors.gray[500],
                            fontSize: "clamp(12px, 1.5vw, 14px)",
                          }}
                        >
                          {u.email}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexWrap: "wrap",
                            marginTop: "8px",
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
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        {!u.roles.includes("Admin") && (
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              setSelectedUserForAction(u.id);
                              await loadUserDetails(u.id);
                              setShowRoleModal(true);
                              setNewRole(u.roles[0] || "User");
                            }}
                            style={{ fontSize: "12px", padding: "6px 12px" }}
                          >
                            🧩 Rol Değiştir
                          </Button>
                        )}
                        {(u.roles.includes("ServiceProvider") ||
                          u.roles.includes("Operator")) && (
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              setSelectedUserForAction(u.id);
                              const details = await loadUserDetails(u.id);
                              setShowBranchModal(true);
                              setNewBranch(details?.branch?.id || "");
                            }}
                            style={{ fontSize: "12px", padding: "6px 12px" }}
                          >
                            🏪 Şube Değiştir
                          </Button>
                        )}
                        {!u.roles.includes("Admin") && (
                          <Button
                            variant="danger"
                            onClick={() => {
                              setSelectedUserForAction(u.id);
                              setShowDeleteModal(true);
                            }}
                            style={{ fontSize: "12px", padding: "6px 12px" }}
                          >
                            🗑️ Sil
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUserForAction("");
        }}
        title="Kullanıcıyı Sil"
      >
        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: colors.gray[700], marginBottom: "16px" }}>
            Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri
            alınamaz.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUserForAction("");
              }}
            >
              İptal
            </Button>
            <Button variant="danger" onClick={handleDeleteUser}>
              Sil
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUserForAction("");
        }}
        title="Rol Değiştir"
      >
        <div style={{ marginBottom: "24px" }}>
          <label style={commonStyles.formLabel}>Yeni Rol</label>
          <select
            style={commonStyles.select}
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="Admin">Admin</option>
            <option value="Operator">Operator</option>
            <option value="ServiceProvider">ServiceProvider</option>
            <option value="User">User</option>
          </select>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUserForAction("");
              }}
            >
              İptal
            </Button>
            <Button variant="primary" onClick={handleUpdateRole}>
              Güncelle
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBranchModal}
        onClose={() => {
          setShowBranchModal(false);
          setSelectedUserForAction("");
          setNewBranch("");
        }}
        title="Şube Değiştir"
      >
        <div style={{ marginBottom: "24px" }}>
          <label style={commonStyles.formLabel}>Yeni Şube</label>
          <select
            style={commonStyles.select}
            value={newBranch}
            onChange={(e) => setNewBranch(Number(e.target.value))}
          >
            <option value="">Şube seçin</option>
            {allBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.depName} - {b.name}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "16px" }}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowBranchModal(false);
                setSelectedUserForAction("");
                setNewBranch("");
              }}
            >
              İptal
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateBranch}
              disabled={!newBranch}
            >
              Güncelle
            </Button>
          </div>
        </div>
      </Modal>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSuccessMessage("");
        }}
        message={successMessage}
      />
    </PageContainer>
  );
}
