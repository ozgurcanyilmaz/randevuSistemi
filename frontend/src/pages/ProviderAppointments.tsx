import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

type Appt = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  userId?: string;
  fullName?: string;
  checkedInAt?: string;
  notes?: string;
  providerNotes?: string;
  serviceProviderProfileId?: number;
};

type Slot = { start: string; end: string };
type Tab = "upcoming" | "past" | "all";

export default function ProviderAppointments() {
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [selectedAppt, setSelectedAppt] = useState<Appt | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpUser, setFollowUpUser] = useState<string>("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpSlots, setFollowUpSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Appt[]>("/provider/appointments");
      setItems(data || []);
    } catch {
      setError("Randevular yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toDate = (a: Appt) => {
    const dt = `${a.date}T${a.startTime}`;
    const d = new Date(dt);
    return isNaN(d.getTime()) ? new Date(a.date) : d;
  };

  const formatDate = (dStr: string) => {
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    }
    const [y, m, dd] = dStr.split("-");
    if (y && m && dd) return `${dd}.${m}.${y}`;
    return dStr;
  };

  const formatTime = (t: string) => t;
  const now = new Date();
  const sorted = useMemo(
    () => [...items].sort((a, b) => toDate(b).getTime() - toDate(a).getTime()),
    [items]
  );

  const upcoming = useMemo(
    () => sorted.filter((a) => toDate(a).getTime() >= now.getTime()),
    [sorted, now]
  );

  const past = useMemo(
    () => sorted.filter((a) => toDate(a).getTime() < now.getTime()),
    [sorted, now]
  );

  const dataForTab =
    activeTab === "upcoming" ? upcoming : activeTab === "past" ? past : sorted;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return dataForTab;
    return dataForTab.filter((a) =>
      (a.fullName || "").toLowerCase().includes(s)
    );
  }, [dataForTab, q]);

  const uniqueUsers = useMemo(() => {
    const userMap = new Map<string, { id: string; name: string }>();
    items.forEach((a) => {
      if (a.userId && !userMap.has(a.userId)) {
        userMap.set(a.userId, { id: a.userId, name: a.fullName || a.userId });
      }
    });
    return Array.from(userMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [items]);

  async function saveNote() {
    if (!selectedAppt) return;
    setSavingNote(true);
    setError(null);
    try {
      await api.post("/provider/appointments/add-note", {
        appointmentId: selectedAppt.id,
        providerNotes: noteText,
      });
      await load();
      setSelectedAppt(null);
      setNoteText("");
      setSuccess("Not başarıyla kaydedildi!");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Not kaydedilemedi.");
    } finally {
      setSavingNote(false);
    }
  }

  async function loadFollowUpSlots() {
    if (!followUpDate || items.length === 0) return;
    setLoadingSlots(true);
    try {
      const providerId = items[0]?.serviceProviderProfileId;
      if (!providerId) {
        setError("Provider ID bulunamadı.");
        setLoadingSlots(false);
        return;
      }

      const { data } = await api.get(`/user/providers/${providerId}/slots`, {
        params: { date: followUpDate },
      });
      setFollowUpSlots(
        data.map((x: any) => ({
          start: x.start || x.Start,
          end: x.end || x.End,
        }))
      );
    } catch (e: any) {
      console.error("Slot loading error:", e);
      setError("Uygun saatler yüklenemedi.");
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    if (followUpDate) loadFollowUpSlots();
  }, [followUpDate]);

  async function createFollowUp(start: string, end: string) {
    if (!followUpUser || !followUpDate) return;
    setError(null);
    try {
      await api.post("/provider/appointments/create-followup", {
        userId: followUpUser,
        date: followUpDate,
        start,
        end,
        notes: "Takip randevusu",
      });
      setShowFollowUp(false);
      setFollowUpUser("");
      setFollowUpDate("");
      setFollowUpSlots([]);
      await load();
      setSuccess("Takip randevusu başarıyla oluşturuldu!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.response?.data || "Takip randevusu oluşturulamadı.");
    }
  }

  const todayStr = useMemo(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
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
            Randevularım
          </h1>
          <p style={{ color: "#64748b" }}>
            Randevuları yönetin, not ekleyin ve takip randevusu oluşturun.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              borderRadius: 8,
              color: "#166534",
            }}
          >
            {success}
          </div>
        )}

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            marginBottom: "16px",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0" }}>
            <button
              onClick={() => setActiveTab("upcoming")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background:
                  activeTab === "upcoming" ? "#eff6ff" : "transparent",
                color: activeTab === "upcoming" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "upcoming" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              ⏳ Yaklaşan ({upcoming.length})
            </button>
            <button
              onClick={() => setActiveTab("past")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "past" ? "#eff6ff" : "transparent",
                color: activeTab === "past" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "past" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              📜 Geçmiş ({past.length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              style={{
                flex: 1,
                padding: "16px 24px",
                fontWeight: 500,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                background: activeTab === "all" ? "#eff6ff" : "transparent",
                color: activeTab === "all" ? "#1d4ed8" : "#64748b",
                borderBottom:
                  activeTab === "all" ? "2px solid #2563eb" : "none",
                transition: "all 0.2s",
              }}
            >
              📁 Tümü ({sorted.length})
            </button>
          </div>

          <div
            style={{
              padding: "16px",
              display: "flex",
              gap: 12,
              alignItems: "center",
              background: "#f8fafc",
            }}
          >
            <input
              className="form-control"
              placeholder="Kullanıcı adına göre ara..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ maxWidth: 360 }}
            />
            <button
              style={{
                background: "transparent",
                color: "#64748b",
                fontWeight: 500,
                padding: "8px 16px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                opacity: !q ? 0.5 : 1,
              }}
              onClick={() => setQ("")}
              disabled={!q}
            >
              Temizle
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
                marginBottom: 16,
                padding: "12px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                color: "#64748b",
              }}
            >
              Yükleniyor...
            </div>
          )}

          {!loading && filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "#94a3b8",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px dashed #cbd5e1",
              }}
            >
              {q
                ? "Arama sonucuna uygun randevu bulunamadı."
                : activeTab === "upcoming"
                ? "Yaklaşan randevu bulunmuyor."
                : activeTab === "past"
                ? "Geçmiş randevu kaydı bulunmuyor."
                : "Henüz randevu bulunmuyor."}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {filtered.map((a) => {
                const isPast = toDate(a).getTime() < now.getTime();
                const checked = !!a.checkedInAt;
                return (
                  <div
                    key={a.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: 20,
                      background: "#f8fafc",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: "#1e293b",
                            marginBottom: 4,
                          }}
                        >
                          👤 {a.fullName || "Kullanıcı"}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: "#64748b",
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                          }}
                        >
                          <span>📅 {formatDate(a.date)}</span>
                          <span>
                            ⏰ {formatTime(a.startTime)} –{" "}
                            {formatTime(a.endTime)}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "6px 14px",
                          borderRadius: "9999px",
                          fontSize: "13px",
                          fontWeight: 600,
                          background: checked
                            ? "#dcfce7"
                            : isPast
                            ? "#e5e7eb"
                            : "#fee2e2",
                          color: checked
                            ? "#166534"
                            : isPast
                            ? "#374151"
                            : "#991b1b",
                        }}
                      >
                        {checked
                          ? "✓ Check-in"
                          : isPast
                          ? "📋 Geçti"
                          : "⏳ Bekliyor"}
                      </span>
                    </div>

                    {a.notes && (
                      <div
                        style={{
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#1e40af",
                            marginBottom: 4,
                          }}
                        >
                          📝 Randevu Notu:
                        </div>
                        <div style={{ fontSize: 14, color: "#1e40af" }}>
                          {a.notes}
                        </div>
                      </div>
                    )}

                    {a.providerNotes && (
                      <div
                        style={{
                          background: "#dcfce7",
                          border: "1px solid #bbf7d0",
                          borderRadius: 8,
                          padding: 12,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#166534",
                            marginBottom: 4,
                          }}
                        >
                          💬 İlgili Notu:
                        </div>
                        <div style={{ fontSize: 14, color: "#166534" }}>
                          {a.providerNotes}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontWeight: 500,
                          padding: "8px 16px",
                          border: "1px solid #bfdbfe",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          transition: "all 0.2s",
                        }}
                        onClick={() => {
                          setSelectedAppt(a);
                          setNoteText(a.providerNotes || "");
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#dbeafe";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "#eff6ff";
                        }}
                      >
                        {a.providerNotes ? "✏️ Notu Düzenle" : "📝 Not Ekle"}
                      </button>
                      {a.userId && (
                        <button
                          style={{
                            background: "#ecfdf5",
                            color: "#166534",
                            fontWeight: 500,
                            padding: "8px 16px",
                            border: "1px solid #bbf7d0",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontSize: 13,
                            transition: "all 0.2s",
                          }}
                          onClick={() => {
                            setFollowUpUser(a.userId!);
                            setShowFollowUp(true);
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#d1fae5";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#ecfdf5";
                          }}
                        >
                          ➕ Takip Randevusu
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedAppt && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => !savingNote && setSelectedAppt(null)}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 32,
                maxWidth: 500,
                width: "90%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 16,
                }}
              >
                İlgili Notu
              </h2>
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  background: "#f8fafc",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}
                >
                  👤 Kullanıcı:{" "}
                  <strong style={{ color: "#1e293b" }}>
                    {selectedAppt.fullName}
                  </strong>
                </div>
                <div style={{ fontSize: 14, color: "#64748b" }}>
                  📅 Randevu: {formatDate(selectedAppt.date)} -{" "}
                  {formatTime(selectedAppt.startTime)}
                </div>
              </div>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Randevu notu yazın..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{ marginBottom: 16 }}
              />
              <div
                style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
              >
                <button
                  style={{
                    background: "transparent",
                    color: "#64748b",
                    fontWeight: 500,
                    padding: "10px 20px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  onClick={() => !savingNote && setSelectedAppt(null)}
                  disabled={savingNote}
                >
                  İptal
                </button>
                <button
                  style={{
                    background: "#2563eb",
                    color: "white",
                    fontWeight: 500,
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: 8,
                    cursor: savingNote ? "not-allowed" : "pointer",
                    fontSize: 14,
                  }}
                  onClick={saveNote}
                  disabled={savingNote}
                >
                  {savingNote ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showFollowUp && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowFollowUp(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 32,
                maxWidth: 600,
                width: "90%",
                maxHeight: "80vh",
                overflow: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 16,
                }}
              >
                Takip Randevusu Oluştur
              </h2>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#334155",
                    marginBottom: 8,
                  }}
                >
                  👤 Kullanıcı Seçin
                </label>
                <select
                  className="form-control"
                  value={followUpUser}
                  onChange={(e) => setFollowUpUser(e.target.value)}
                >
                  <option value="">Kullanıcı seçin...</option>
                  {uniqueUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {followUpUser && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#334155",
                        marginBottom: 8,
                      }}
                    >
                      📅 Tarih Seçin
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      min={todayStr}
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </div>

                  {followUpDate && (
                    <div>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#1e293b",
                          marginBottom: 12,
                        }}
                      >
                        ⏰ Uygun Saatler
                      </h3>
                      {loadingSlots ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: 24,
                            color: "#64748b",
                          }}
                        >
                          Yükleniyor...
                        </div>
                      ) : followUpSlots.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: 24,
                            color: "#94a3b8",
                            background: "#f8fafc",
                            borderRadius: 8,
                            border: "1px dashed #cbd5e1",
                          }}
                        >
                          Bu tarihte uygun saat bulunamadı.
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(130px, 1fr))",
                            gap: 8,
                          }}
                        >
                          {followUpSlots.map((s, i) => (
                            <button
                              key={i}
                              style={{
                                padding: "12px 16px",
                                border: "2px solid #bfdbfe",
                                background: "white",
                                color: "#1e40af",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: 14,
                                transition: "all 0.2s",
                              }}
                              onClick={() => createFollowUp(s.start, s.end)}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "#eff6ff";
                                e.currentTarget.style.borderColor = "#60a5fa";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = "white";
                                e.currentTarget.style.borderColor = "#bfdbfe";
                              }}
                            >
                              {s.start}
                              <br />—<br />
                              {s.end}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: 24,
                }}
              >
                <button
                  style={{
                    background: "transparent",
                    color: "#64748b",
                    fontWeight: 500,
                    padding: "10px 20px",
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                  onClick={() => {
                    setShowFollowUp(false);
                    setFollowUpUser("");
                    setFollowUpDate("");
                    setFollowUpSlots([]);
                  }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
