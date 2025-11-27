import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Button,
  Badge,
  Loading,
  EmptyState,
} from "../../components/common";
import { commonStyles, colors, getButtonHoverHandlers } from "../../styles/commonStyles";

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
  const [showAllDepartments, setShowAllDepartments] = useState(false);
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
    const base = {
      Admin: 0,
      Operator: 0,
      ServiceProvider: 0,
      User: 0,
      Other: 0,
    };
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

  const recentUsers = useMemo(() => users.slice(0, 5), [users]);

  const displayedDepartments = showAllDepartments
    ? departments
    : departments.slice(0, 10);

  return (
    <PageContainer>
      <PageHeader
        title="Admin Özeti"
        subtitle="Departmanlar, şubeler ve kullanıcılar için hızlı bir genel bakış"
      />

      <Card>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.gray[200]}`,
            background: colors.gray[50],
          }}
        >
          <Button
            variant="primary"
            onClick={() => navigate("/admin/departments")}
          >
            🏢 Departman Yönetimine Git
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/admin/roles")}
          >
            🧩 Kullanıcı Yönetimine Git
          </Button>
        </div>
      </Card>

      {loading && <Loading message="Veriler yükleniyor..." />}

      <div style={commonStyles.grid.threeColumn}>
        <KpiCard
          icon="🏢"
          label="Departman"
          value={totalDepartments}
          hint="Toplam departman"
        />
        <KpiCard
          icon="🏪"
          label="Şube"
          value={totalBranches}
          hint="Toplam şube"
        />
        <KpiCard
          icon="👥"
          label="Kullanıcı"
          value={users.length}
          hint="Toplam kullanıcı"
        />
      </div>

      <Card style={{ marginTop: "24px" }}>
        <div
          style={{
            fontSize: "13px",
            color: colors.gray[500],
            marginBottom: "8px",
          }}
        >
          Rol Dağılımı
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Badge variant="primary">
            Admin: {roleCounts.Admin}
          </Badge>
          <Badge variant="primary">
            Operator: {roleCounts.Operator}
          </Badge>
          <Badge variant="primary">
            ServiceProvider: {roleCounts.ServiceProvider}
          </Badge>
          <Badge variant="primary">
            User: {roleCounts.User}
          </Badge>
          {roleCounts.Other > 0 && (
            <Badge variant="error">
              Diğer/Yok: {roleCounts.Other}
            </Badge>
          )}
        </div>
      </Card>

      <div style={commonStyles.grid.twoColumn}>
        <Card>
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${colors.gray[100]}`,
              background: colors.gray[50],
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h2 style={commonStyles.cardSubheader}>
              🗂️ Departmanlar & Şubeler
            </h2>
            <span style={commonStyles.badge.success}>
              {totalBranches} şube
            </span>
          </div>

          {departments.length === 0 ? (
            <EmptyState message="Henüz departman bulunmuyor." />
          ) : (
            <>
              <div
                style={{
                  maxHeight: "500px",
                  overflowY: "auto",
                  overflowX: "hidden",
                }}
              >
                {displayedDepartments.map((d, index) => (
                  <div
                    key={d.id}
                    style={{
                      padding: "14px 20px",
                      borderBottom:
                        index < displayedDepartments.length - 1
                          ? `1px solid ${colors.gray[100]}`
                          : "none",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.gray[50];
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "white";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          color: colors.gray[900],
                          fontSize: "14px",
                          fontWeight: 600,
                          wordBreak: "break-word",
                        }}
                      >
                        🏢 {d.name}
                      </div>
                      <span style={commonStyles.badge.gray}>
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
                        {d.branches!.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 500,
                              background: colors.primary[50],
                              color: colors.primary[800],
                            }}
                          >
                            📍 {b.name}
                          </span>
                        ))}
                        {(d.branches!.length || 0) > 3 && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "4px 10px",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 500,
                              background: colors.error[100],
                              color: colors.error[800],
                            }}
                          >
                            +{d.branches!.length - 3} şube daha
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {departments.length > 10 && (
                <div
                  style={{
                    padding: "12px 20px",
                    background: colors.gray[50],
                    borderTop: `1px solid ${colors.gray[200]}`,
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => setShowAllDepartments(!showAllDepartments)}
                    style={{
                      background: "transparent",
                      color: colors.primary[700],
                      fontWeight: 500,
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      transition: "all 0.2s",
                    }}
                    {...getButtonHoverHandlers("secondary")}
                  >
                    {showAllDepartments
                      ? "▲ Daha Az Göster"
                      : `▼ ${departments.length - 10} Departman Daha`}
                  </button>
                </div>
              )}
            </>
          )}
        </Card>

        <div style={{ display: "grid", gap: "24px" }}>
          <Card>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${colors.gray[100]}`,
                background: colors.gray[50],
              }}
            >
              <h2 style={commonStyles.cardSubheader}>
                ⭐ En Çok Şubeli Departmanlar
              </h2>
            </div>

            {topDepartments.length === 0 ? (
              <EmptyState message="Gösterilecek veri yok." />
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
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
                          ? `1px solid ${colors.gray[100]}`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        color: colors.gray[900],
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
                        background: colors.primary[100],
                        color: colors.primary[800],
                      }}
                    >
                      {d.branchCount} şube
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${colors.gray[100]}`,
                background: colors.gray[50],
              }}
            >
              <h2 style={commonStyles.cardSubheader}>
                👥 Son Kayıt Olan Kullanıcılar
              </h2>
            </div>

            {recentUsers.length === 0 ? (
              <EmptyState message="Henüz kullanıcı yok." />
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
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
                          ? `1px solid ${colors.gray[100]}`
                          : "none",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ color: colors.gray[900], fontSize: "14px", flex: 1, minWidth: "150px" }}>
                      <div style={{ fontWeight: 600, wordBreak: "break-word" }}>
                        {u.fullName || u.email}
                      </div>
                      <div
                        style={{
                          color: colors.gray[500],
                          fontSize: "13px",
                          wordBreak: "break-word",
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
                        justifyContent: "flex-end",
                      }}
                    >
                      {u.roles?.length ? (
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
      </div>

      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          background: colors.gray[50],
          border: `1px dashed ${colors.gray[300]}`,
          borderRadius: "8px",
          color: colors.gray[500],
          fontSize: "14px",
        }}
      >
        Daha detaylı yönetim için yukarıdaki kısa yollardan ilgili sayfalara
        gidebilirsiniz.
      </div>
    </PageContainer>
  );
}

function KpiCard({
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
    <Card>
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div
        style={{
          color: colors.gray[900],
          fontSize: "22px",
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: colors.gray[700],
          fontWeight: 600,
          fontSize: "14px",
        }}
      >
        {label}
      </div>
      {hint && (
        <div
          style={{
            color: colors.gray[500],
            fontSize: "12px",
            marginTop: "6px",
          }}
        >
          {hint}
        </div>
      )}
    </Card>
  );
}
