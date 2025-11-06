import { useEffect, useState } from "react";
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
};

export default function OperatorHome() {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [branchId, setBranchId] = useState<number | "">("");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerId, setProviderId] = useState<number | "">("");
  const [slotDate, setSlotDate] = useState("");
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | "">("");
  const [notes, setNotes] = useState("");
  const [userQuery, setUserQuery] = useState("");

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userHighlight, setUserHighlight] = useState(-1);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"approvals" | "create">(
    "approvals"
  );

  async function search() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/operator/appointments/search", {
        params: { name: query, date },
      });
      setItems(data);
    } catch {
      setError("Randevular yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  async function checkIn(id: number) {
    try {
      await api.post("/operator/appointments/check-in", { appointmentId: id });
      await search();
      setSuccess("Randevu onaylandı");
      setTimeout(() => setSuccess(null), 2500);
    } catch {
      setError("Onaylama başarısız");
    }
  }

  async function loadDepartments() {
    try {
      const { data } = await api.get<Department[]>("/user/departments");
      setDepartments(data);
    } catch {
      setError("Şubeler yüklenemedi");
    }
  }

  async function loadProviders(id: number) {
    try {
      const { data } = await api.get<Provider[]>(
        `/user/branches/${id}/providers`
      );
      setProviders(data);
    } catch {
      setError("İlgililer yüklenemedi");
    }
  }

  async function loadSlots(pid: number, d: string) {
    try {
      if (!d || !pid) {
        setSlots([]);
        return;
      }
      const { data } = await api.get(`/user/providers/${pid}/slots`, {
        params: { date: d },
      });
      setSlots(
        data.map((x: any) => ({
          start: x.start || x.Start,
          end: x.end || x.End,
        }))
      );
    } catch {
      setError("Müsait saatler yüklenemedi");
    }
  }

  async function createAppointment(start: string, end: string) {
    setError(null);
    setSuccess(null);
    try {
      if (!providerId || !slotDate) {
        setError("Şube/İlgili/Tarih seçmeden randevu oluşturulamaz");
        return;
      }
      if (!selectedUserId) {
        setError("Kullanıcı seçmeniz gerekiyor");
        return;
      }
      await api.post("/operator/appointments", {
        providerId,
        date: slotDate,
        start,
        end,
        notes,
        userId: selectedUserId,
      });

      setNotes("");
      setSelectedUserId("");
      await loadSlots(Number(providerId), slotDate);

      setSuccess("Randevu oluşturuldu");
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      const msg = e?.response?.data || e?.message || "Randevu oluşturulamadı";
      setError(typeof msg === "string" ? msg : "Randevu oluşturulamadı");
    }
  }

  useEffect(() => {
    loadDepartments();
    setUserQuery("");
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        if (!userQuery || userQuery.trim().length < 2) {
          setUsers([]);
          return;
        }
        const r = await api.get<UserRow[]>("/operator/users", {
          params: { q: userQuery },
        });
        setUsers(r.data);
        setUserMenuOpen(true);
      } catch {
        setError("Kullanıcılar yüklenemedi");
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userQuery]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = document.getElementById("user-autocomplete-root");
      if (el && !el.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function chooseUser(u: UserRow) {
    setSelectedUserId(u.id);
    setUserQuery(u.fullName || u.email || "");
    setUserMenuOpen(false);
    setUserHighlight(-1);
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
            Randevu Yönetimi (Operatör)
          </h1>
          <p style={{ color: "#64748b" }}>
            Randevuları arayın/onaylayın ya da yeni randevu oluşturun
          </p>
        </div>

        {/* Tabs */}
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
              onClick={() => setActiveTab("approvals")}
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
              onClick={() => setActiveTab("create")}
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

        {/* alerts */}
        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}
        {success && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px 16px",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "8px",
              color: "#065f46",
            }}
          >
            {success}
          </div>
        )}

        {/* Card */}
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
                    disabled={loading}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = "#1d4ed8")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = "#2563eb")
                    }
                  >
                    {loading ? "Aranıyor..." : "🔍 Ara"}
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
                        <th style={thStyle}>📅 Tarih</th>
                        <th style={thStyle}>⏰ Başlangıç</th>
                        <th style={thStyle}>⏰ Bitiş</th>
                        <th style={thStyle}>👤 Kullanıcı</th>
                        <th style={thStyle}>Durum</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>
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
                            style={rowStyle}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.background = "#f8fafc")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.background = "white")
                            }
                          >
                            <td style={tdStyle}>{i.date}</td>
                            <td style={tdStyle}>{i.startTime}</td>
                            <td style={tdStyle}>{i.endTime}</td>
                            <td style={tdStyle}>{i.user}</td>
                            <td
                              style={{ padding: "16px 24px", fontSize: "14px" }}
                            >
                              {i.checkedInAt ? (
                                <span style={pillOk}>✓ Onaylandı</span>
                              ) : (
                                <span style={pillWait}>⏳ Bekliyor</span>
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
                                  style={btnApprove}
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
                {/* Şube */}
                <div>
                  <label style={labelStyle}>Şube</label>
                  <select
                    style={selectStyle}
                    value={branchId}
                    onChange={async (e) => {
                      const id = Number(e.target.value);
                      setBranchId(id);
                      setProviderId("");
                      setSlotDate("");
                      setSlots([]);
                      if (id) await loadProviders(id);
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

                {/* İlgili */}
                <div>
                  <label style={labelStyle}>İlgili</label>
                  <select
                    style={{
                      ...selectStyle,
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

                {/* Tarih */}
                <div>
                  <label style={labelStyle}>Tarih</label>
                  <input
                    style={inputStyle}
                    type="date"
                    value={slotDate}
                    onChange={async (e) => {
                      const d = e.target.value;
                      setSlotDate(d);
                      if (providerId) await loadSlots(Number(providerId), d);
                    }}
                  />
                </div>

                <div
                  id="user-autocomplete-root"
                  style={{ position: "relative" }}
                >
                  <label style={labelStyle}>Kullanıcı</label>

                  <input
                    style={inputStyle}
                    value={userQuery}
                    placeholder="İsim veya e-posta yazın…"
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      setSelectedUserId("");
                      setUserMenuOpen(true);
                      setUserHighlight(-1);
                    }}
                    onFocus={() => {
                      if ((userQuery?.trim().length || 0) >= 2)
                        setUserMenuOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (!userMenuOpen || users.length === 0) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setUserHighlight((h) => (h + 1) % users.length);
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setUserHighlight(
                          (h) => (h - 1 + users.length) % users.length
                        );
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        const u = users[userHighlight] ?? users[0];
                        if (u) chooseUser(u);
                      } else if (e.key === "Escape") {
                        setUserMenuOpen(false);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setUserMenuOpen(false), 120);
                    }}
                  />

                  <input type="hidden" value={selectedUserId || ""} readOnly />

                  {userMenuOpen && (userQuery?.trim().length || 0) >= 2 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "white",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        marginTop: "6px",
                        boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                        maxHeight: "220px",
                        overflowY: "auto",
                        zIndex: 50,
                      }}
                    >
                      {users.length === 0 ? (
                        <div
                          style={{
                            padding: "10px 12px",
                            color: "#94a3b8",
                            fontSize: 14,
                          }}
                        >
                          Sonuç yok
                        </div>
                      ) : (
                        users.map((u, idx) => (
                          <div
                            key={u.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              chooseUser(u);
                            }}
                            onMouseEnter={() => setUserHighlight(idx)}
                            style={{
                              padding: "10px 12px",
                              fontSize: 14,
                              cursor: "pointer",
                              background:
                                idx === userHighlight ? "#eff6ff" : "white",
                              color:
                                idx === userHighlight ? "#1d4ed8" : "#0f172a",
                              borderBottom: "1px solid #f1f5f9",
                            }}
                          >
                            {u.fullName || u.email}
                            {u.fullName && (
                              <span style={{ color: "#94a3b8" }}>
                                {" "}
                                — {u.email}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {(!userQuery || userQuery.trim().length < 2) && (
                    <div
                      style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}
                    >
                      En az 2 karakter yazın
                    </div>
                  )}
                </div>
              </div>

              {/* Notlar */}
              <div style={{ marginBottom: "24px" }}>
                <label style={labelStyle}>Notlar</label>
                <input
                  style={inputStyle}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Randevu hakkında notlar..."
                />
              </div>

              {/* Slotlar */}
              <div
                style={{ borderTop: "1px solid #e2e8f0", paddingTop: "24px" }}
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

const thStyle: React.CSSProperties = {
  padding: "12px 24px",
  textAlign: "left",
  fontSize: "11px",
  fontWeight: "600",
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const tdStyle: React.CSSProperties = {
  padding: "16px 24px",
  fontSize: "14px",
  color: "#0f172a",
};
const rowStyle: React.CSSProperties = {
  borderBottom: "1px solid #f1f5f9",
  transition: "background 0.2s",
};
const pillOk: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: "500",
  background: "#dcfce7",
  color: "#166534",
};
const pillWait: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 12px",
  borderRadius: "9999px",
  fontSize: "12px",
  fontWeight: "500",
  background: "#fef3c7",
  color: "#92400e",
};
const btnApprove: React.CSSProperties = {
  background: "#16a34a",
  color: "white",
  fontWeight: "500",
  padding: "6px 16px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "12px",
  transition: "all 0.2s",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: "500",
  color: "#334155",
  marginBottom: "8px",
};
const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "14px",
  background: "white",
  cursor: "pointer",
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "14px",
};
