export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  return dateStr;
};

export const formatDateTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return "";

  return new Date(dateTimeStr).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTime = (timeStr: string): string => {
  return timeStr;
};

export const getTodayStr = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getAppointmentDate = (dateStr: string, timeStr: string): Date => {
  const dateTime = `${dateStr}T${timeStr}`;
  const date = new Date(dateTime);
  return isNaN(date.getTime()) ? new Date(dateStr) : date;
};

export const isDateInPast = (dateStr: string, timeStr?: string): boolean => {
  const date = timeStr
    ? getAppointmentDate(dateStr, timeStr)
    : new Date(dateStr);
  return date.getTime() < Date.now();
};

export const formatNumber = (num?: number | null): string => {
  if (num === null || num === undefined) return "";
  return num.toString();
};

export const isValidTcKimlikNo = (tcNo: string): boolean => {
  return /^\d{11}$/.test(tcNo);
};

export const isValidPhone = (phone: string): boolean => {
  return /^[0-9+\-()\s]{10,}$/.test(phone);
};
