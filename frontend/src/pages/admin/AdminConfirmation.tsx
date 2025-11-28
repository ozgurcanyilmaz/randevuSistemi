import { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Alert,
  Button,
  Badge,
  EmptyState,
  Tabs,
  Input,
  Textarea,
} from "../../components/common";
import { commonStyles, colors } from "../../styles/commonStyles";
import { formatDate, formatTime } from "../../utils/formatters";

type SearchItem = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  serviceProviderProfileId: number;
  user: string;
  checkedInAt?: string;
};
type Department = {
  id: number;
  name: string;
  branches: { id: number; name: string }[];
};
type Provider = {
  id: number;
  fullName: string;
  email: string;
  sessionDurationMinutes: number;
};
type UserRow = {
  id: string;
  email: string;
  fullName?: string;
  roles: string[];
};

export default function AdminConfirmation() {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState<number | "">("");
  const [slotDate, setSlotDate] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | "">("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<"approvals" | "create">(
    "approvals"
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const todayStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }, []);

  useEffect(() => {
    if (location.pathname.endsWith("/create")) setActiveTab("create");
    else setActiveTab("approvals");
  }, [location.pathname]);

  async function loadDepartments() {
    const { data } = await api.get<Department[]>("/user/departments");
    setDepartments(data);
  }

  async function loadProviders(id: number) {
    const { data } = await api.get<Provider[]>(
      `/user/branches/${id}/providers`
    );
    setProviders(data);
  }

  async function loadSlots(pid: number, d: string) {
    if (!d || !pid) return setSlots([]);
    const { data } = await api.get(`/user/providers/${pid}/slots`, {
      params: { date: d },
    });
    setSlots(
      data.map((x: any) => ({ start: x.start || x.Start, end: x.end || x.End }))
    );
  }

  async function search() {
    try {
      const { data } = await api.get("/admin/appointments/search", {
        params: { name: query, date },
      });
      setItems(data);
    } catch {
      setError("Randevular yüklenemedi");
    }
  }

  async function checkIn(id: number) {
    try {
      await api.post("/admin/appointments/check-in", { appointmentId: id });
      await search();
      setSuccess("Randevu onaylandı");
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      setError("Onaylama başarısız");
    }
  }

  async function createAppointment(start: string, end: string) {
    setError(null);
    setSuccess(null);
    if (!providerId || !slotDate) {
      setError("Şube/İlgili/Tarih seçmeden randevu oluşturulamaz");
      return;
    }
    if (!selectedUserId) {
      setError("Kullanıcı seçmeniz gerekiyor");
      return;
    }
    try {
      await api.post("/admin/appointments", {
        providerId,
        date: slotDate,
        start,
        end,
        notes,
        userId: selectedUserId,
      });
      setSelectedUserId("");
      setNotes("");
      setSlots([]);
      setSuccess("Randevu oluşturuldu");
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      const msg = e?.response?.data || "Randevu oluşturulamadı";
      setError(typeof msg === "string" ? msg : "Randevu oluşturulamadı");
    }
  }

  useEffect(() => {
    loadDepartments();
    (async () => {
      const r = await api.get<UserRow[]>("/admin/users");
      setUsers(r.data);
    })();
  }, []);

  const allBranches = departments.flatMap((d) =>
    d.branches.map((b) => ({ ...b, depName: d.name }))
  );

  const tabs = [
    { id: "approvals", label: "✓ Randevu Onaylama" },
    { id: "create", label: "+ Yeni Randevu" },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Randevu Yönetimi"
        subtitle="Randevuları onaylayın ve yeni randevular oluşturun"
      />

      {error && <Alert type="error" message={error} />}
      {success && <Alert type="success" message={success} />}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId as "approvals" | "create");
          if (tabId === "approvals") {
            navigate("/admin/confirmation");
          } else {
            navigate("/admin/confirmation/create");
          }
        }}
      />

      <Card>
        {activeTab === "approvals" && (
          <div>
            <h2 style={commonStyles.cardSubheader}>🔍 Randevu Ara</h2>

            <div
              style={{
                ...commonStyles.grid.formGrid,
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                marginBottom: "24px",
              }}
            >
              <div>
                <Input
                  label="Kullanıcı Adı veya E-posta"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ad veya e-posta ile ara..."
                />
              </div>
              <div>
                <Input
                  label="Tarih"
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <Button variant="primary" onClick={search} style={{ width: "100%" }}>
                  🔍 Ara
                </Button>
              </div>
            </div>

            <div style={commonStyles.table.container}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead
                    style={{
                      background: colors.gray[50],
                      borderBottom: `1px solid ${colors.gray[200]}`,
                    }}
                  >
                    <tr>
                      <th style={commonStyles.table.header}>📅 Tarih</th>
                      <th style={commonStyles.table.header}>⏰ Başlangıç</th>
                      <th style={commonStyles.table.header}>⏰ Bitiş</th>
                      <th style={commonStyles.table.header}>👤 Kullanıcı</th>
                      <th style={commonStyles.table.header}>Durum</th>
                      <th
                        style={{
                          ...commonStyles.table.header,
                          textAlign: "right",
                        }}
                      >
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: "48px 24px",
                            textAlign: "center",
                            color: colors.gray[400],
                            fontSize: "clamp(12px, 2vw, 14px)",
                          }}
                        >
                          Henüz randevu bulunmuyor. Arama yaparak randevuları
                          görüntüleyin.
                        </td>
                      </tr>
                    ) : (
                      items.map((i) => (
                        <tr
                          key={i.id}
                          style={commonStyles.table.row}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.gray[50];
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                          }}
                        >
                          <td style={commonStyles.table.cell}>
                            {formatDate(i.date)}
                          </td>
                          <td style={commonStyles.table.cell}>
                            {formatTime(i.startTime)}
                          </td>
                          <td style={commonStyles.table.cell}>
                            {formatTime(i.endTime)}
                          </td>
                          <td style={commonStyles.table.cell}>{i.user}</td>
                          <td style={commonStyles.table.cell}>
                            {i.checkedInAt ? (
                              <Badge variant="success">✓ Onaylandı</Badge>
                            ) : (
                              <Badge variant="warning">⏳ Bekliyor</Badge>
                            )}
                          </td>
                          <td
                            style={{
                              ...commonStyles.table.cell,
                              textAlign: "right",
                            }}
                          >
                            {!i.checkedInAt && (
                              <Button
                                variant="success"
                                onClick={() => checkIn(i.id)}
                                style={{
                                  fontSize: "clamp(11px, 1.5vw, 12px)",
                                  padding: "6px 16px",
                                }}
                              >
                                Onayla
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "create" && (
          <div>
            <h2 style={commonStyles.cardSubheader}>➕ Yeni Randevu Oluştur</h2>

            <div
              style={{
                ...commonStyles.grid.formGrid,
                marginBottom: "24px",
              }}
            >
              <div>
                <label style={commonStyles.formLabel}>Şube</label>
                <select
                  style={commonStyles.select}
                  value={branchId}
                  onChange={async (e) => {
                    const id = Number(e.target.value);
                    setBranchId(id);
                    setProviderId("");
                    setSlotDate("");
                    setSlots([]);
                    await loadProviders(id);
                  }}
                >
                  <option value="">Şube seçin</option>
                  {allBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.depName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={commonStyles.formLabel}>İlgili</label>
                <select
                  style={{
                    ...commonStyles.select,
                    background: !branchId ? colors.gray[100] : "white",
                    cursor: !branchId ? "not-allowed" : "pointer",
                  }}
                  value={providerId}
                  onChange={async (e) => {
                    const id = Number(e.target.value);
                    setProviderId(id);
                    await loadSlots(id, slotDate);
                  }}
                  disabled={!branchId}
                >
                  <option value="">İlgili seçin</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName || p.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Tarih"
                  type="date"
                  min={todayStr}
                  value={slotDate}
                  onChange={async (e) => {
                    const d = e.target.value;
                    setSlotDate(d);
                    if (providerId) await loadSlots(Number(providerId), d);
                  }}
                />
              </div>

              <div>
                <label style={commonStyles.formLabel}>Kullanıcı</label>
                <select
                  style={commonStyles.select}
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Kullanıcı seçin</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.email}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <Textarea
                label="Notlar"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Randevu hakkında notlar..."
                rows={2}
              />
            </div>

            <div
              style={{
                borderTop: `1px solid ${colors.gray[200]}`,
                paddingTop: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "clamp(13px, 2vw, 14px)",
                  fontWeight: 600,
                  color: colors.gray[600],
                  marginBottom: "16px",
                }}
              >
                ⏰ Müsait Saatler
              </h3>
              {slots.length === 0 ? (
                <EmptyState message="Müsait saat görmek için şube, ilgili ve tarih seçiniz" />
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {slots.map((s, i) => (
                    <Button
                      key={i}
                      variant="secondary"
                      onClick={() => createAppointment(s.start, s.end)}
                      disabled={!providerId || !slotDate || !selectedUserId}
                      style={{
                        fontSize: "clamp(11px, 1.5vw, 14px)",
                        padding: "12px 16px",
                        border: `2px solid ${colors.primary[200]}`,
                        color: colors.primary[800],
                      }}
                    >
                      {s.start} - {s.end}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
}
