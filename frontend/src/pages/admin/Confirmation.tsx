import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../services/api";

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

  const location = useLocation();
  const navigate = useNavigate();

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
    const { data } = await api.get("/admin/appointments/search", {
      params: { name: query, date },
    });
    setItems(data);
  }

  async function checkIn(id: number) {
    await api.post("/admin/appointments/check-in", { appointmentId: id });
    await search();
    alert("Checked in");
  }

  async function createAppointment(start: string, end: string) {
    if (!providerId || !slotDate) return;
    if (!selectedUserId) {
      alert("User selection required");
      return;
    }
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
    alert("Appointment created");
  }

  useEffect(() => {
    loadDepartments();
    (async () => {
      const r = await api.get<UserRow[]>("/admin/users");
      setUsers(r.data);
    })();
  }, []);

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
            Randevu Yönetimi
          </h1>
          <p style={{ color: "#64748b" }}>
            Randevuları onaylayın ve yeni randevular oluşturun
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
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <button
              onClick={() => navigate("/admin/confirmation")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: "500",
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "approvals" ? "#eff6ff" : "transparent",
                color: activeTab === "approvals" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "approvals" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              ✓ Randevu Onaylama
            </button>
            <button
              onClick={() => navigate("/admin/confirmation/create")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: "500",
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "create" ? "#eff6ff" : "transparent",
                color: activeTab === "create" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "create" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              + Yeni Randevu
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
          {activeTab === "approvals" && (
            <div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "16px",
                }}
              >
                🔍 Randevu Ara
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ gridColumn: "span 2" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Kullanıcı Adı veya E-posta
                  </label>
                  <input
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      transition: "all 0.2s",
                    }}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ad veya e-posta ile ara..."
                    onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                    onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Tarih
                  </label>
                  <input
                    type="date"
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    style={{
                      width: "100%",
                      background: "#2563eb",
                      color: "white",
                      fontWeight: "500",
                      padding: "10px 16px",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "all 0.2s",
                    }}
                    onClick={search}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#1d4ed8")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "#2563eb")
                    }
                  >
                    🔍 Ara
                  </button>
                </div>
              </div>

              <div
                style={{
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead
                      style={{
                        background: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            padding: "12px 24px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          📅 Tarih
                        </th>
                        <th
                          style={{
                            padding: "12px 24px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          ⏰ Başlangıç
                        </th>
                        <th
                          style={{
                            padding: "12px 24px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          ⏰ Bitiş
                        </th>
                        <th
                          style={{
                            padding: "12px 24px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          👤 Kullanıcı
                        </th>
                        <th
                          style={{
                            padding: "12px 24px",
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          Durum
                        </th>
                        <th
                          style={{
                            padding: "12px 24px",
                            textAlign: "right",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#475569",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
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
                              color: "#94a3b8",
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
                            style={{
                              borderBottom: "1px solid #f1f5f9",
                              transition: "background 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.background = "#f8fafc")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.background = "white")
                            }
                          >
                            <td
                              style={{
                                padding: "16px 24px",
                                fontSize: "14px",
                                color: "#0f172a",
                              }}
                            >
                              {i.date}
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                fontSize: "14px",
                                color: "#0f172a",
                              }}
                            >
                              {i.startTime}
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                fontSize: "14px",
                                color: "#0f172a",
                              }}
                            >
                              {i.endTime}
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                fontSize: "14px",
                                color: "#0f172a",
                              }}
                            >
                              {i.user}
                            </td>
                            <td
                              style={{ padding: "16px 24px", fontSize: "14px" }}
                            >
                              {i.checkedInAt ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "4px 12px",
                                    borderRadius: "9999px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    background: "#dcfce7",
                                    color: "#166534",
                                  }}
                                >
                                  ✓ Onaylandı
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "4px 12px",
                                    borderRadius: "9999px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    background: "#fef3c7",
                                    color: "#92400e",
                                  }}
                                >
                                  ⏳ Bekliyor
                                </span>
                              )}
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                fontSize: "14px",
                                textAlign: "right",
                              }}
                            >
                              {!i.checkedInAt && (
                                <button
                                  style={{
                                    background: "#16a34a",
                                    color: "white",
                                    fontWeight: "500",
                                    padding: "6px 16px",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    transition: "all 0.2s",
                                  }}
                                  onClick={() => checkIn(i.id)}
                                  onMouseOver={(e) =>
                                    (e.currentTarget.style.background =
                                      "#15803d")
                                  }
                                  onMouseOut={(e) =>
                                    (e.currentTarget.style.background =
                                      "#16a34a")
                                  }
                                >
                                  Onayla
                                </button>
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
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#1e293b",
                  marginBottom: "24px",
                }}
              >
                ➕ Yeni Randevu Oluştur
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Şube
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
                    {departments.flatMap((d) =>
                      d.branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {d.name} - {b.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    İlgili
                  </label>
                  <select
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                      background: !branchId ? "#f1f5f9" : "white",
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
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Tarih
                  </label>
                  <input
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }}
                    type="date"
                    value={slotDate}
                    onChange={async (e) => {
                      const d = e.target.value;
                      setSlotDate(d);
                      if (providerId) await loadSlots(Number(providerId), d);
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#334155",
                      marginBottom: "8px",
                    }}
                  >
                    Kullanıcı
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
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  Notlar
                </label>
                <input
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Randevu hakkında notlar..."
                />
              </div>

              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#475569",
                    marginBottom: "16px",
                  }}
                >
                  ⏰ Müsait Saatler
                </h3>
                {slots.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 24px",
                      color: "#94a3b8",
                    }}
                  >
                    Müsait saat görmek için şube, ilgili ve tarih seçiniz
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {slots.map((s, i) => (
                      <button
                        key={i}
                        style={{
                          padding: "12px 16px",
                          border: "2px solid #bfdbfe",
                          color: "#1e40af",
                          borderRadius: "8px",
                          background: "white",
                          cursor:
                            !providerId || !slotDate
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: "500",
                          fontSize: "14px",
                          transition: "all 0.2s",
                          opacity: !providerId || !slotDate ? 0.5 : 1,
                        }}
                        onClick={() => createAppointment(s.start, s.end)}
                        disabled={!providerId || !slotDate}
                        onMouseOver={(e) => {
                          if (providerId && slotDate) {
                            e.currentTarget.style.background = "#eff6ff";
                            e.currentTarget.style.borderColor = "#60a5fa";
                          }
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "white";
                          e.currentTarget.style.borderColor = "#bfdbfe";
                        }}
                      >
                        {s.start} - {s.end}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
