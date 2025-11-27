import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../services/api";
import {
  PageContainer,
  PageHeader,
  Card,
  Alert,
  Button,
  Badge,
  Loading,
  EmptyState,
  Tabs,
  Input,
} from "../../components/common";
import { commonStyles, colors } from "../../styles/commonStyles";
import { formatDate, formatTime, formatDateTime } from "../../utils/formatters";

type WaitingItem = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  checkedInAt: string;
  fullName?: string;
};

type TimeFilter = "today" | "week" | "month";

const REFRESH_MS = 10_000;

export default function ProviderWaiting() {
  const [items, setItems] = useState<WaitingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const timerRef = useRef<number | null>(null);

  const getDateRange = (filter: TimeFilter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "today":
        return { start: today, end: new Date(today.getTime() + 86400000) };
      case "week": {
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 7);
        return { start: monday, end: sunday };
      }
      case "month": {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: firstDay, end: new Date(lastDay.getTime() + 86400000) };
      }
    }
  };

  const toDate = (dStr: string, tStr?: string) => {
    if (tStr) return new Date(`${dStr}T${tStr}`);
    return new Date(dStr);
  };

  async function load() {
    setError(null);
    try {
      const { data } = await api.get<WaitingItem[]>("/provider/waiting");
      setItems(data ?? []);
      setLastUpdated(new Date());
    } catch {
      setError("Bekleyen kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = window.setInterval(load, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [autoRefresh]);

  const now = new Date();
  const dateRange = getDateRange(timeFilter);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();

    let result = items.filter((a) => {
      const appointmentDate = toDate(a.date);
      return (
        appointmentDate >= dateRange.start && appointmentDate < dateRange.end
      );
    });

    result = result.filter(
      (a) => toDate(a.date, a.startTime).getTime() >= now.getTime()
    );

    result.sort(
      (a, b) =>
        new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime()
    );

    if (s) {
      result = result.filter((a) =>
        (a.fullName || "").toLowerCase().includes(s)
      );
    }

    return result;
  }, [items, q, timeFilter, dateRange]);

  const getFilterLabel = (filter: TimeFilter) => {
    switch (filter) {
      case "today":
        return "Bugün";
      case "week":
        return "Bu Hafta";
      case "month":
        return "Bu Ay";
    }
  };

  const getFilterCount = (filter: TimeFilter) => {
    const range = getDateRange(filter);
    return items.filter((a) => {
      const appointmentDate = toDate(a.date);
      return (
        appointmentDate >= range.start &&
        appointmentDate < range.end &&
        toDate(a.date, a.startTime).getTime() >= now.getTime()
      );
    }).length;
  };

  const tabs = [
    {
      id: "today",
      label: `Bugün (${getFilterCount("today")})`,
    },
    {
      id: "week",
      label: `Bu Hafta (${getFilterCount("week")})`,
    },
    {
      id: "month",
      label: `Bu Ay (${getFilterCount("month")})`,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Bekleyen Ziyaretçiler"
        subtitle="Check-in yapmış ve yaklaşan randevuları olan kullanıcıları görüntüleyin."
      />

      <Tabs
        tabs={tabs}
        activeTab={timeFilter}
        onTabChange={(tabId) => setTimeFilter(tabId as TimeFilter)}
      />

      <Card style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flex: 1,
              minWidth: "200px",
            }}
          >
            <Input
              placeholder="Kullanıcı adına göre ara..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ flex: 1, maxWidth: "360px" }}
            />
            <Button variant="secondary" onClick={() => setQ("")} disabled={!q}>
              Temizle
            </Button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Button variant="secondary" onClick={() => load()} disabled={loading}>
              Yenile
            </Button>
            <Button
              variant={autoRefresh ? "danger" : "success"}
              onClick={() => setAutoRefresh((v) => !v)}
              title={
                autoRefresh
                  ? "Otomatik yenilemeyi durdur"
                  : "Otomatik yenilemeyi başlat"
              }
            >
              {autoRefresh ? "Durdur" : "Başlat"}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        {loading && <Loading message="Yükleniyor..." />}
        {error && <Alert type="error" message={error} />}

        {!loading && filtered.length === 0 ? (
          <EmptyState
            message={
              q
                ? "Arama sonucuna uygun bekleyen kullanıcı yok."
                : `${getFilterLabel(timeFilter)} için yaklaşan check-in yok.`
            }
          />
        ) : (
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
                    <th style={commonStyles.table.header}>Onay Zamanı</th>
                    <th style={commonStyles.table.header}>Randevu Tarihi</th>
                    <th style={commonStyles.table.header}>Saat</th>
                    <th style={commonStyles.table.header}>Kullanıcı</th>
                    <th style={commonStyles.table.header}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      style={commonStyles.table.row}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.gray[50];
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <td style={commonStyles.table.cell}>
                        {formatDateTime(a.checkedInAt)}
                      </td>
                      <td style={commonStyles.table.cell}>
                        {formatDate(a.date)}
                      </td>
                      <td style={commonStyles.table.cell}>
                        {formatTime(a.startTime)} – {formatTime(a.endTime)}
                      </td>
                      <td style={commonStyles.table.cell}>
                        {a.fullName || "-"}
                      </td>
                      <td style={commonStyles.table.cell}>
                        <Badge variant="success">Check-in</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div
          style={{
            marginTop: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: colors.gray[500],
            fontSize: "clamp(11px, 1.5vw, 13px)",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            {lastUpdated
              ? `Son güncelleme: ${lastUpdated.toLocaleTimeString("tr-TR")}`
              : ""}
          </div>
          <div>
            Otomatik yenileme {autoRefresh ? "açık (10 sn)" : "kapalı"}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
