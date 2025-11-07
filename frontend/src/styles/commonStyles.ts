import type { CSSProperties } from "react";

export const colors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  gray: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },
  success: {
    50: "#ecfdf5",
    100: "#d1fae5",
    200: "#a7f3d0",
    300: "#6ee7b7",
    400: "#34d399",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  error: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  warning: {
    50: "#fefce8",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  green: {
    50: "#dcfce7",
    100: "#bbf7d0",
    500: "#10b981",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
  },
};

export const commonStyles = {
  pageContainer: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
    padding: "24px",
  } as CSSProperties,

  contentWrapper: {
    maxWidth: "1280px",
    margin: "0 auto",
  } as CSSProperties,

  pageHeader: {
    marginBottom: "24px",
  } as CSSProperties,

  pageTitle: {
    fontSize: "30px",
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: "8px",
  } as CSSProperties,

  pageSubtitle: {
    color: colors.gray[500],
    fontSize: "15px",
  } as CSSProperties,

  card: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: `1px solid ${colors.gray[200]}`,
    padding: "24px",
  } as CSSProperties,

  cardHeader: {
    fontSize: "20px",
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: "16px",
  } as CSSProperties,

  cardSubheader: {
    fontSize: "18px",
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: "16px",
  } as CSSProperties,

  tabContainer: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: `1px solid ${colors.gray[200]}`,
    marginBottom: "24px",
    overflow: "hidden",
  } as CSSProperties,

  tabButtonWrapper: {
    display: "flex",
    borderBottom: `1px solid ${colors.gray[200]}`,
  } as CSSProperties,

  getTabButton: (isActive: boolean): CSSProperties => ({
    flex: 1,
    padding: "16px 24px",
    fontWeight: "500",
    fontSize: "14px",
    cursor: "pointer",
    border: "none",
    background: isActive ? colors.primary[50] : "transparent",
    color: isActive ? colors.primary[700] : colors.gray[500],
    borderBottom: isActive ? `2px solid ${colors.primary[600]}` : "none",
    transition: "all 0.2s",
  }),

  formLabel: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: colors.gray[700],
    marginBottom: "8px",
  } as CSSProperties,

  input: {
    width: "100%",
    padding: "10px 16px",
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: "8px",
    fontSize: "14px",
    transition: "all 0.2s",
  } as CSSProperties,

  select: {
    width: "100%",
    padding: "10px 16px",
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: "8px",
    fontSize: "14px",
    background: "white",
    cursor: "pointer",
  } as CSSProperties,

  textarea: {
    width: "100%",
    padding: "10px 16px",
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: "8px",
    fontSize: "14px",
    minHeight: "80px",
    resize: "vertical" as const,
  } as CSSProperties,

  button: {
    primary: {
      background: colors.primary[600],
      color: "white",
      fontWeight: "500",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s",
    } as CSSProperties,

    secondary: {
      background: "transparent",
      color: colors.gray[500],
      fontWeight: "500",
      padding: "10px 20px",
      border: `1px solid ${colors.gray[300]}`,
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s",
    } as CSSProperties,

    success: {
      background: colors.green[600],
      color: "white",
      fontWeight: "500",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s",
    } as CSSProperties,

    danger: {
      background: colors.error[600],
      color: "white",
      fontWeight: "500",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.2s",
    } as CSSProperties,

    disabled: {
      background: colors.gray[400],
      color: "white",
      fontWeight: "500",
      padding: "10px 20px",
      border: "none",
      borderRadius: "8px",
      cursor: "not-allowed",
      fontSize: "14px",
    } as CSSProperties,
  },

  badge: {
    success: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "6px 14px",
      borderRadius: "9999px",
      fontSize: "13px",
      fontWeight: "600",
      background: colors.green[50],
      color: colors.green[800],
    } as CSSProperties,

    warning: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "6px 14px",
      borderRadius: "9999px",
      fontSize: "13px",
      fontWeight: "600",
      background: colors.warning[100],
      color: colors.warning[800],
    } as CSSProperties,

    error: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "6px 14px",
      borderRadius: "9999px",
      fontSize: "13px",
      fontWeight: "600",
      background: colors.error[100],
      color: colors.error[800],
    } as CSSProperties,

    primary: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "6px 14px",
      borderRadius: "9999px",
      fontSize: "13px",
      fontWeight: "600",
      background: colors.primary[100],
      color: colors.primary[800],
    } as CSSProperties,

    gray: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "6px 14px",
      borderRadius: "9999px",
      fontSize: "13px",
      fontWeight: "600",
      background: colors.gray[200],
      color: colors.gray[700],
    } as CSSProperties,
  },

  alert: {
    success: {
      marginBottom: "16px",
      padding: "12px 16px",
      background: colors.success[50],
      border: `1px solid ${colors.success[200]}`,
      borderRadius: "8px",
      color: colors.success[800],
      fontSize: "14px",
    } as CSSProperties,

    error: {
      marginBottom: "16px",
      padding: "12px 16px",
      background: colors.error[50],
      border: `1px solid ${colors.error[200]}`,
      borderRadius: "8px",
      color: colors.error[800],
      fontSize: "14px",
    } as CSSProperties,

    warning: {
      marginBottom: "16px",
      padding: "12px 16px",
      background: colors.warning[50],
      border: `1px solid ${colors.warning[300]}`,
      borderRadius: "8px",
      color: colors.warning[800],
      fontSize: "14px",
    } as CSSProperties,

    info: {
      marginBottom: "16px",
      padding: "12px 16px",
      background: colors.primary[50],
      border: `1px solid ${colors.primary[200]}`,
      borderRadius: "8px",
      color: colors.primary[800],
      fontSize: "14px",
    } as CSSProperties,
  },

  emptyState: {
    textAlign: "center" as const,
    padding: "48px 24px",
    color: colors.gray[400],
    background: colors.gray[50],
    borderRadius: "8px",
    border: `1px dashed ${colors.gray[300]}`,
  } as CSSProperties,

  table: {
    container: {
      overflow: "hidden",
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: "8px",
    } as CSSProperties,

    header: {
      padding: "12px 24px",
      textAlign: "left" as const,
      fontSize: "11px",
      fontWeight: "600",
      color: colors.gray[600],
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
    } as CSSProperties,

    cell: {
      padding: "16px 24px",
      fontSize: "14px",
      color: colors.gray[900],
    } as CSSProperties,

    row: {
      borderBottom: `1px solid ${colors.gray[100]}`,
      transition: "background 0.2s",
    } as CSSProperties,
  },

  // Modal
  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "24px",
  } as CSSProperties,

  modalContent: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  } as CSSProperties,

  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: colors.gray[800],
    marginBottom: "8px",
  } as CSSProperties,

  grid: {
    twoColumn: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: "24px",
    } as CSSProperties,

    threeColumn: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "16px",
    } as CSSProperties,

    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "16px",
    } as CSSProperties,
  },

  loading: {
    marginBottom: "16px",
    padding: "12px 16px",
    background: colors.gray[50],
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: "8px",
    color: colors.gray[500],
    fontSize: "14px",
  } as CSSProperties,

  divider: {
    borderTop: `1px solid ${colors.gray[200]}`,
    marginTop: "24px",
    marginBottom: "24px",
  } as CSSProperties,
};

export const getHoverStyle = (baseColor: string, hoverColor: string) => ({
  onMouseOver: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = hoverColor;
  },
  onMouseOut: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = baseColor;
  },
});

export const getButtonHoverHandlers = (
  variant: "primary" | "secondary" | "success" | "danger" = "primary"
) => {
  const hoverColors = {
    primary: { base: colors.primary[600], hover: colors.primary[700] },
    secondary: { base: "transparent", hover: colors.gray[100] },
    success: { base: colors.green[600], hover: colors.green[700] },
    danger: { base: colors.error[600], hover: colors.error[700] },
  };

  return getHoverStyle(hoverColors[variant].base, hoverColors[variant].hover);
};
