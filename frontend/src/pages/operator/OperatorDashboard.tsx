import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Button,
  Loading,
  EmptyState,
} from "../../components/common";
import {
  commonStyles,
  colors,
  getButtonHoverHandlers,
} from "../../styles/commonStyles";
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
      <PageContainer>
        <Loading message="Yükleniyor..." />
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer>
        <Card>
          <div
            style={{
              background: colors.error[50],
              border: `1px solid ${colors.error[200]}`,
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              color: colors.error[800],
            }}
          >
            {error || "Bir hata oluştu"}
          </div>
        </Card>
      </PageContainer>
    );
  }

  const displayedProviders = showAllProviders
    ? data.providerStats
    : data.providerStats.slice(0, 5);

  const displayedCheckIns = showAllCheckIns
    ? data.recentCheckIns
    : data.recentCheckIns.slice(0, 5);

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
            border: `1px solid ${colors.gray[200]}`,
            borderRadius: 8,
            padding: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              color: colors.gray[800],
              marginBottom: 8,
            }}
          >
            {data.fullName}
          </div>
          <div
            style={{ fontSize: 13, color: colors.gray[500], marginBottom: 4 }}
          >
            🏪 {data.branch}
          </div>
          <div
            style={{ fontSize: 13, color: colors.success[600], marginBottom: 2 }}
          >
            ✓ Check-in: {data["Check-in"]}
          </div>
          <div
            style={{ fontSize: 13, color: colors.warning[600], marginBottom: 2 }}
          >
            ⏳ Bekleyen: {data["Bekleyen"]}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: colors.gray[800],
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
    <PageContainer>
      <PageHeader
        title="Operatör Özeti"
        subtitle="Günlük randevu istatistikleri ve check-in durumları"
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
            onClick={() => navigate("/operator/appointments")}
          >
            📋 Randevu İşlemleri
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate("/operator/walk-in")}
          >
            🚶 Walk-in Randevu
          </Button>
        </div>
      </Card>

      <div style={commonStyles.grid.threeColumn}>
        <KpiCard
          icon="📅"
          title="Bugün"
          value={data.today.total}
          subtitle={`${data.today.checkedIn} check-in, ${data.today.pending} bekliyor`}
          progress={data.today.checkInRate}
          color={colors.primary[600]}
        />
        <KpiCard
          icon="📊"
          title="Bu Hafta"
          value={data.week.total}
          subtitle={`${data.week.checkedIn} check-in yapıldı`}
          progress={data.week.checkInRate}
          color={colors.primary[700]}
        />
        <KpiCard
          icon="📈"
          title="Bu Ay"
          value={data.month.total}
          subtitle={`${data.month.checkedIn} check-in yapıldı`}
          progress={data.month.checkInRate}
          color={colors.success[600]}
        />
      </div>

      <Card style={{ marginTop: "24px" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.gray[100]}`,
            background: colors.gray[50],
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2 style={commonStyles.cardSubheader}>
            📊 İlgililer - Bugünkü Randevular
          </h2>
          <span style={commonStyles.badge.success}>
            {data.providerStats.length} ilgili
          </span>
        </div>

        {data.providerStats.length === 0 ? (
          <EmptyState message="Bugün için randevu bulunmuyor." />
        ) : (
          <>
            <div
              style={{
                padding: displayedProviders.length <= 3 ? "16px 20px" : "20px",
                overflowX: "auto",
                maxWidth: "100%",
              }}
            >
              <ResponsiveContainer
                width="100%"
                height={
                  displayedProviders.length === 0
                    ? 200
                    : displayedProviders.length === 1
                    ? 180
                    : displayedProviders.length === 2
                    ? 220
                    : displayedProviders.length === 3
                    ? 260
                    : Math.min(displayedProviders.length * 50 + 100, 500)
                }
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 30,
                    left: Math.min(140, Math.max(100, displayedProviders.length * 15)),
                    bottom: 10,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.gray[100]} />
                  <XAxis
                    type="number"
                    stroke={colors.gray[500]}
                    style={{ fontSize: 11 }}
                    allowDecimals={false}
                    tick={{ fill: colors.gray[600] }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={colors.gray[500]}
                    width={Math.min(140, Math.max(100, displayedProviders.length * 15))}
                    style={{ fontSize: 11 }}
                    tick={{ fill: colors.gray[600] }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: colors.gray[50] }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: "8px" }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="Check-in"
                    stackId="a"
                    fill={colors.success[600]}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Bekleyen"
                    stackId="a"
                    fill={colors.warning[500]}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {data.providerStats.length > 5 && (
              <div
                style={{
                  padding: "12px 20px",
                  background: colors.gray[50],
                  borderTop: `1px solid ${colors.gray[100]}`,
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => setShowAllProviders(!showAllProviders)}
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
                  {showAllProviders
                    ? "▲ Daha Az"
                    : `▼ ${data.providerStats.length - 5} İlgili Daha`}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <Card style={{ marginTop: "24px" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${colors.gray[100]}`,
            background: colors.gray[50],
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2 style={commonStyles.cardSubheader}>⏱️ Son Check-in'ler</h2>
          <span style={commonStyles.badge.primary}>
            Toplam: {data.recentCheckIns.length}
          </span>
        </div>

        {data.recentCheckIns.length === 0 ? (
          <EmptyState message="Bugün henüz check-in yapılmamış." />
        ) : (
          <>
            <div
              style={{
                maxHeight: "500px",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {displayedCheckIns.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    padding: "14px 20px",
                    borderBottom:
                      index < displayedCheckIns.length - 1
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
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: colors.gray[900],
                          fontSize: 14,
                          marginBottom: 4,
                          wordBreak: "break-word",
                        }}
                      >
                        👤 {item.userName}
                      </div>
                      <div
                        style={{
                          color: colors.gray[500],
                          fontSize: 12,
                          marginBottom: 4,
                          wordBreak: "break-word",
                        }}
                      >
                        🏪 {item.branchName}
                      </div>
                      <div style={{ color: colors.gray[500], fontSize: 12 }}>
                        ⏰ {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={commonStyles.badge.success}>✓</span>
                      <div
                        style={{
                          color: colors.gray[400],
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
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
                  background: colors.gray[50],
                  borderTop: `1px solid ${colors.gray[100]}`,
                  textAlign: "center",
                }}
              >
                <button
                  onClick={() => setShowAllCheckIns(!showAllCheckIns)}
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
                  {showAllCheckIns
                    ? "▲ Daha Az"
                    : `▼ ${data.recentCheckIns.length - 5} Check-in Daha`}
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </PageContainer>
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
    <Card>
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
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "13px",
              color: colors.gray[500],
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
              color: colors.gray[900],
              marginBottom: "4px",
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: "12px", color: colors.gray[400] }}>
            {subtitle}
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: "16px",
          height: "6px",
          background: colors.gray[100],
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
    </Card>
  );
}
