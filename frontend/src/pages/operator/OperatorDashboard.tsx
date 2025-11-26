import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DashboardData = {
  today: {
    total: number;
    checkedIn: number;
    pending: number;
    checkInRate: number;
  };
  week: {
    total: number;
    checkedIn: number;
    checkInRate: number;
  };
  month: {
    total: number;
    checkedIn: number;
    checkInRate: number;
  };
  providerStats: Array<{
    providerId: number;
    providerName: string;
    branchName: string;
    total: number;
    checkedIn: number;
    pending: number;
  }>;
  recentCheckIns: Array<{
    id: number;
    date: string;
    startTime: string;
    endTime: string;
    userName: string;
    branchName: string;
    checkedInAt: string;
  }>;
  hourlyStats: Array<{
    hour: number;
    count: number;
    checkedIn: number;
  }>;
};

export default function OperatorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [showAllCheckIns, setShowAllCheckIns] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: dashData } = await api.get<DashboardData>(
        "/operator/dashboard"
      );
      setData(dashData);
    } catch {
      setError("Dashboard verileri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const formatTime = (t: string) => t;
  const formatDateTime = (s: string) =>
    new Date(s).toLocaleString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Yükleniyor...
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              color: "#991b1b",
            }}
          >
            {error || "Bir hata oluştu"}
          </div>
        </div>
      </div>
    );
  }

  const displayedProviders = showAllProviders
    ? data.providerStats
    : data.providerStats.slice(0, 5);

  const displayedCheckIns = showAllCheckIns
    ? data.recentCheckIns
    : data.recentCheckIns.slice(0, 3);

  const chartData = displayedProviders.map((p) => ({
    name:
      p.providerName.length > 20
        ? p.providerName.substring(0, 18) + "..."
        : p.providerName,
    fullName: p.providerName,
    "Check-in": p.checkedIn,
    Bekleyen: p.pending,
    total: p.total,
    branch: p.branchName,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>
            {data.fullName}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>
            🏪 {data.branch}
          </div>
          <div style={{ fontSize: 13, color: "#16a34a", marginBottom: 2 }}>
            ✓ Check-in: {data["Check-in"]}
          </div>
          <div style={{ fontSize: 13, color: "#f59e0b", marginBottom: 2 }}>
            ⏳ Bekleyen: {data["Bekleyen"]}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1e293b",
              marginTop: 4,
            }}
          >
            📊 Toplam: {data.total}
          </div>
        </div>
      );
    }
    return null;
  };

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
            Operatör Özeti
          </h1>
          <p style={{ color: "#64748b" }}>
            Günlük randevu istatistikleri ve check-in durumları
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
              gap: "12px",
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate("/operator/appointments")}
              style={{
                background: "#2563eb",
                color: "white",
                fontWeight: 500,
                padding: "10px 16px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#1d4ed8")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#2563eb")}
            >
              📋 Randevu İşlemleri
            </button>
            <button
              onClick={() => navigate("/operator/walk-in")}
              style={{
                background: "#f1f5f9",
                color: "#0f172a",
                fontWeight: 500,
                padding: "10px 16px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#e2e8f0")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            >
              🚶 Walk-in Randevu
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <KpiCard
            icon="📅"
            title="Bugün"
            value={data.today.total}
            subtitle={`${data.today.checkedIn} check-in, ${data.today.pending} bekliyor`}
            progress={data.today.checkInRate}
            color="#2563eb"
          />
          <KpiCard
            icon="📊"
            title="Bu Hafta"
            value={data.week.total}
            subtitle={`${data.week.checkedIn} check-in yapıldı`}
            progress={data.week.checkInRate}
            color="#8b5cf6"
          />
          <KpiCard
            icon="📈"
            title="Bu Ay"
            value={data.month.total}
            subtitle={`${data.month.checkedIn} check-in yapıldı`}
            progress={data.month.checkInRate}
            color="#16a34a"
          />
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1e293b",
                margin: 0,
              }}
            >
              📊 İlgililer - Bugünkü Randevular
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                background: "#dcfce7",
                color: "#166534",
              }}
            >
              {data.providerStats.length} ilgili
            </span>
          </div>

          {data.providerStats.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 20px",
                color: "#94a3b8",
                background: "white",
              }}
            >
              Bugün için randevu bulunmuyor.
            </div>
          ) : (
            <>
              <div style={{ padding: 20 }}>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(300, displayedProviders.length * 60)}
                >
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      style={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#64748b"
                      width={140}
                      style={{ fontSize: 12 }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "#f8fafc" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} iconType="circle" />
                    <Bar
                      dataKey="Check-in"
                      stackId="a"
                      fill="#16a34a"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="Bekleyen"
                      stackId="a"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {data.providerStats.length > 5 && (
                <div
                  style={{
                    padding: "12px 20px",
                    background: "#f8fafc",
                    borderTop: "1px solid #f1f5f9",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => setShowAllProviders(!showAllProviders)}
                    style={{
                      background: "transparent",
                      color: "#1d4ed8",
                      fontWeight: 500,
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#eff6ff";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {showAllProviders
                      ? "▲ Daha Az"
                      : `▼ ${data.providerStats.length - 5} İlgili Daha`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#1e293b",
                margin: 0,
              }}
            >
              ⏱️ Son Check-in'ler
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 12px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 600,
                background: "#dbeafe",
                color: "#1e40af",
              }}
            >
              Toplam: {data.recentCheckIns.length}
            </span>
          </div>

          {data.recentCheckIns.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 20px",
                color: "#94a3b8",
                background: "white",
              }}
            >
              Bugün henüz check-in yapılmamış.
            </div>
          ) : (
            <>
              <div>
                {displayedCheckIns.map((item, index) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "14px 20px",
                      borderBottom:
                        index < displayedCheckIns.length - 1
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                            fontSize: 14,
                            marginBottom: 4,
                          }}
                        >
                          👤 {item.userName}
                        </div>
                        <div
                          style={{
                            color: "#64748b",
                            fontSize: 12,
                            marginBottom: 4,
                          }}
                        >
                          🏪 {item.branchName}
                        </div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>
                          ⏰ {formatTime(item.startTime)} -{" "}
                          {formatTime(item.endTime)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 9999,
                            fontSize: 11,
                            fontWeight: 600,
                            background: "#dcfce7",
                            color: "#166534",
                            marginBottom: 4,
                          }}
                        >
                          ✓
                        </span>
                        <div style={{ color: "#94a3b8", fontSize: 11 }}>
                          {formatDateTime(item.checkedInAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {data.recentCheckIns.length > 5 && (
                <div
                  style={{
                    padding: "12px 20px",
                    background: "#f8fafc",
                    borderTop: "1px solid #f1f5f9",
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => setShowAllCheckIns(!showAllCheckIns)}
                    style={{
                      background: "transparent",
                      color: "#1d4ed8",
                      fontWeight: 500,
                      padding: "6px 12px",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 13,
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "#eff6ff";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {showAllCheckIns
                      ? "▲ Daha Az"
                      : `▼ ${data.recentCheckIns.length - 5} Check-in Daha`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  subtitle,
  progress,
  color,
}: {
  icon: string;
  title: string;
  value: number;
  subtitle: string;
  progress: number;
  color: string;
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e2e8f0",
        padding: "20px",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            fontSize: "32px",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${color}15`,
            borderRadius: "12px",
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "13px",
              color: "#64748b",
              marginBottom: "4px",
              fontWeight: 500,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: "4px",
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>{subtitle}</div>
        </div>
      </div>
      <div
        style={{
          marginTop: "16px",
          height: "6px",
          background: "#f1f5f9",
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: color,
            width: `${Math.min(progress, 100)}%`,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div
        style={{
          marginTop: "8px",
          fontSize: "12px",
          fontWeight: 600,
          color,
          textAlign: "right",
        }}
      >
        {progress.toFixed(1)}% Check-in Oranı
      </div>
    </div>
  );
}
