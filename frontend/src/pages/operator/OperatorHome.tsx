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

export default function OperatorHome() {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      alert("Randevu onaylandı");
    } catch {
      setError("Onaylama başarısız");
    }
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
            Randevu Onaylama
          </h1>
          <p style={{ color: "#64748b" }}>
            Randevuları arayın ve onaylayın
          </p>
        </div>

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

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
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
                        <td style={{ padding: "16px 24px", fontSize: "14px" }}>
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
                                (e.currentTarget.style.background = "#15803d")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.background = "#16a34a")
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
      </div>
    </div>
  );
}