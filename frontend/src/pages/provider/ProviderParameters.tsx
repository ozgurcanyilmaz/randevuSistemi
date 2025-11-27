import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { PageContainer, PageHeader, Card, Button, Alert, Loading } from "../../components/common";
import { commonStyles, colors } from "../../styles/commonStyles";

type WorkingHoursReq = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};
type BreakReq = { dayOfWeek: number; startTime: string; endTime: string };

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];
const DAY_INDEX_TO_BACKEND: number[] = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_HOURS: WorkingHoursReq[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: DAY_INDEX_TO_BACKEND[i],
  startTime: "09:00",
  endTime: "17:00",
}));
const DEFAULT_BREAKS: BreakReq[] = [];

export default function Provider() {
  const [session, setSession] = useState<number>(30);
  const [hours, setHours] = useState<WorkingHoursReq[]>(DEFAULT_HOURS);
  const [breaks, setBreaks] = useState<BreakReq[]>(DEFAULT_BREAKS);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState<"session" | "hours" | "breaks" | null>(
    null
  );

  useEffect(() => {
    loadParameters();
  }, []);

  async function loadParameters() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{
        sessionDurationMinutes: number;
        workingHours: WorkingHoursReq[];
        breaks: BreakReq[];
      }>("/provider/parameters");
      
      setSession(data.sessionDurationMinutes || 30);
      
      if (data.workingHours && data.workingHours.length > 0) {
        const loadedHours = [...DEFAULT_HOURS];
        data.workingHours.forEach((wh) => {
          const frontendIndex = DAY_INDEX_TO_BACKEND.indexOf(wh.dayOfWeek);
          if (frontendIndex !== -1) {
            loadedHours[frontendIndex] = wh;
          }
        });
        setHours(loadedHours);
      } else {
        setHours(DEFAULT_HOURS);
      }
      
      if (data.breaks && data.breaks.length > 0) {
        setBreaks(data.breaks);
      } else {
        setBreaks(DEFAULT_BREAKS);
      }
    } catch (err: any) {
      console.error("loadParameters error", err);
      setError("Parametreler yüklenemedi. Varsayılan değerler kullanılıyor.");
      setSession(30);
      setHours(DEFAULT_HOURS);
      setBreaks(DEFAULT_BREAKS);
    } finally {
      setLoading(false);
    }
  }

  async function saveSession() {
    setError(null);
    setInfo(null);
    setSaving("session");
    try {
      await api.post(`/provider/session-duration/${session}`);
      setInfo("Seans süresi kaydedildi.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || "Seans süresi kaydedilemedi.";
      setError(typeof msg === "string" ? msg : "Seans süresi kaydedilemedi.");
    } finally {
      setSaving(null);
    }
  }

  async function saveHours() {
    setError(null);
    setInfo(null);
    setSaving("hours");
    try {
      await api.post("/provider/working-hours", hours);
      setInfo("Çalışma saatleri kaydedildi.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || "Çalışma saatleri kaydedilemedi.";
      setError(typeof msg === "string" ? msg : "Çalışma saatleri kaydedilemedi.");
    } finally {
      setSaving(null);
    }
  }

  async function saveBreaks() {
    setError(null);
    setInfo(null);
    setSaving("breaks");
    try {
      await api.post("/provider/breaks", breaks);
      setInfo("Molalar kaydedildi.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data || "Molalar kaydedilemedi.";
      setError(typeof msg === "string" ? msg : "Molalar kaydedilemedi.");
    } finally {
      setSaving(null);
    }
  }

  function resetHours() {
    setHours(DEFAULT_HOURS);
    setInfo("Çalışma saatleri varsayana döndürüldü (09:00–17:00).");
  }
  function resetBreaks() {
    setBreaks(DEFAULT_BREAKS);
    setInfo("Molalar varsayana döndürüldü.");
  }

  const backendDayOfWeek = DAY_INDEX_TO_BACKEND[selectedDay];
  const selectedDayHours = hours.find((h) => h.dayOfWeek === backendDayOfWeek);
  const selectedDayBreaks = breaks.filter((b) => b.dayOfWeek === backendDayOfWeek);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Parametreler"
          subtitle="Seans süresi, çalışma saatleri ve molalarınızı yönetin."
        />
        <Card>
          <Loading message="Parametreler yükleniyor..." />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Parametreler"
        subtitle="Seans süresi, çalışma saatleri ve molalarınızı yönetin."
      />

      {error && <Alert type="error" message={error} />}
      {info && <Alert type="info" message={info} />}

      <Card style={{ marginBottom: 24 }}>
          <h2 style={commonStyles.cardSubheader}>
            ⏱️ Seans Uzunluğu
          </h2>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: 1, maxWidth: 200 }}>
              <label style={commonStyles.formLabel}>
                Dakika
              </label>
              <input
                style={commonStyles.input}
                type="number"
                min={5}
                step={5}
                value={session}
                onChange={(e) => setSession(Number(e.target.value))}
              />
            </div>
            <Button
              variant="primary"
              onClick={saveSession}
              disabled={saving === "session"}
            >
              {saving === "session" ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: colors.gray[500],
            }}
          >
            5–240 dk aralığında ve 5'in katı olmalı.
          </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <h2 style={commonStyles.cardSubheader}>
          📅 Gün Seçin
        </h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DAYS.map((day, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                style={{
                  padding: "12px 20px",
                  border:
                    selectedDay === idx
                      ? "2px solid #2563eb"
                      : "1px solid #cbd5e1",
                  background: selectedDay === idx ? "#eff6ff" : "white",
                  color: selectedDay === idx ? "#1d4ed8" : "#334155",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: 14,
                  transition: "all 0.2s",
                }}
              >
                {day}
              </button>
            ))}
          </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2 style={commonStyles.cardSubheader}>
            🕒 {DAYS[selectedDay]} - Çalışma Saatleri
          </h2>
          <Button variant="secondary" onClick={resetHours}>
            Tümünü Sıfırla
          </Button>
        </div>

          {selectedDayHours && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <label style={commonStyles.formLabel}>
                  Başlangıç
                </label>
                <input
                  style={commonStyles.input}
                  type="time"
                  value={selectedDayHours.startTime}
                  onChange={(e) =>
                    setHours(
                      hours.map((h) =>
                        h.dayOfWeek === backendDayOfWeek
                          ? { ...h, startTime: e.target.value }
                          : h
                      )
                    )
                  }
                />
              </div>
              <div>
                <label style={commonStyles.formLabel}>
                  Bitiş
                </label>
                <input
                  style={commonStyles.input}
                  type="time"
                  value={selectedDayHours.endTime}
                  onChange={(e) =>
                    setHours(
                      hours.map((h) =>
                        h.dayOfWeek === backendDayOfWeek
                          ? { ...h, endTime: e.target.value }
                          : h
                      )
                    )
                  }
                />
              </div>
            </div>
          )}

          <Button
            variant="primary"
            onClick={saveHours}
            disabled={saving === "hours"}
          >
            {saving === "hours"
              ? "Kaydediliyor..."
              : "Çalışma Saatlerini Kaydet"}
          </Button>
      </Card>

      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2 style={commonStyles.cardSubheader}>
            ☕ {DAYS[selectedDay]} - Molalar
          </h2>
          <Button variant="secondary" onClick={resetBreaks}>
            Tümünü Sıfırla
          </Button>
        </div>

          {selectedDayBreaks.length === 0 ? (
            <div style={commonStyles.emptyState}>
              Bu gün için tanımlı mola yok.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
              {selectedDayBreaks.map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr)) auto",
                    gap: 12,
                    padding: 12,
                    background: "#f8fafc",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <label style={commonStyles.formLabel}>
                      Başlangıç
                    </label>
                    <input
                      style={commonStyles.input}
                      type="time"
                      value={b.startTime}
                      onChange={(e) => {
                        const allBreaksIdx = breaks.findIndex((br) => br === b);
                        setBreaks(
                          breaks.map((br, i) =>
                            i === allBreaksIdx
                              ? { ...br, startTime: e.target.value }
                              : br
                          )
                        );
                      }}
                    />
                  </div>
                  <div>
                    <label style={commonStyles.formLabel}>
                      Bitiş
                    </label>
                    <input
                      style={commonStyles.input}
                      type="time"
                      value={b.endTime}
                      onChange={(e) => {
                        const allBreaksIdx = breaks.findIndex((br) => br === b);
                        setBreaks(
                          breaks.map((br, i) =>
                            i === allBreaksIdx
                              ? { ...br, endTime: e.target.value }
                              : br
                          )
                        );
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <Button
                      variant="danger"
                      onClick={() => setBreaks(breaks.filter((br) => br !== b))}
                    >
                      Kaldır
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              onClick={() =>
                setBreaks([
                  ...breaks,
                  {
                    dayOfWeek: backendDayOfWeek,
                    startTime: "12:00",
                    endTime: "13:00",
                  },
                ])
              }
            >
              + Mola Ekle
            </Button>
            <Button
              variant="primary"
              onClick={saveBreaks}
              disabled={saving === "breaks"}
            >
              {saving === "breaks" ? "Kaydediliyor..." : "Molaları Kaydet"}
            </Button>
          </div>
      </Card>
    </PageContainer>
  );
}
