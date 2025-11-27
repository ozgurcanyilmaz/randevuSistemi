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

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const commonStyles = {
  pageContainer: {
    minHeight: "100vh",
    background: "linear-gradient(to bottom right, #f8fafc, #f1f5f9)",
    padding: "16px",
    boxSizing: "border-box" as const,
  } as CSSProperties,

  contentWrapper: {
    maxWidth: "1280px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box" as const,
  } as CSSProperties,

  pageHeader: {
    marginBottom: "20px",
  } as CSSProperties,

  pageTitle: {
    fontSize: "clamp(20px, 4vw, 30px)",
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: "8px",
    lineHeight: "1.2",
  } as CSSProperties,

  pageSubtitle: {
    color: colors.gray[500],
    fontSize: "clamp(13px, 2.5vw, 15px)",
    lineHeight: "1.5",
  } as CSSProperties,

  card: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: `1px solid ${colors.gray[200]}`,
    padding: "16px",
    width: "100%",
    boxSizing: "border-box" as const,
  } as CSSProperties,

  cardHeader: {
    fontSize: "clamp(16px, 3vw, 20px)",
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: "12px",
  } as CSSProperties,

  cardSubheader: {
    fontSize: "clamp(14px, 2.5vw, 18px)",
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: "12px",
  } as CSSProperties,

  tabContainer: {
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: `1px solid ${colors.gray[200]}`,
    marginBottom: "20px",
    overflow: "hidden",
  } as CSSProperties,

  tabButtonWrapper: {
    display: "flex",
    borderBottom: `1px solid ${colors.gray[200]}`,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch" as const,
  } as CSSProperties,

  getTabButton: (isActive: boolean): CSSProperties => ({
    flex: 1,
    padding: "12px 16px",
    fontWeight: "500",
    fontSize: "clamp(12px, 2vw, 14px)",
    cursor: "pointer",
    border: "none",
    background: isActive ? colors.primary[50] : "transparent",
    color: isActive ? colors.primary[700] : colors.gray[500],
    borderBottom: isActive ? `2px solid ${colors.primary[600]}` : "none",
    transition: "all 0.2s",
    whiteSpace: "nowrap" as const,
    minWidth: "fit-content",
  }),

  formLabel: {
    display: "block",
    fontSize: "clamp(12px, 2vw, 14px)",
    fontWeight: "500",
    color: colors.gray[700],
    marginBottom: "6px",
  } as CSSProperties,

  input: {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: "6px",
    fontSize: "14px",
    transition: "all 0.2s",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  } as CSSProperties,

  inputFocus: {
    outline: "none",
    borderColor: colors.primary[500],
    boxShadow: `0 0 0 3px ${colors.primary[100]}`,
  } as CSSProperties,

  select: {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: "6px",
    fontSize: "14px",
    background: "white",
    cursor: "pointer",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  } as CSSProperties,

  textarea: {
    width: "100%",
    padding: "8px 12px",
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: "6px",
    fontSize: "14px",
    minHeight: "80px",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  } as CSSProperties,

  button: {
    primary: {
      background: colors.primary[600],
      color: "white",
      fontWeight: "500",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "clamp(12px, 2vw, 14px)",
      transition: "all 0.2s",
      whiteSpace: "nowrap" as const,
    } as CSSProperties,

    secondary: {
      background: "transparent",
      color: colors.gray[700],
      fontWeight: "500",
      padding: "8px 16px",
      border: `1px solid ${colors.gray[300]}`,
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "clamp(12px, 2vw, 14px)",
      transition: "all 0.2s",
      whiteSpace: "nowrap" as const,
    } as CSSProperties,

    success: {
      background: colors.green[600],
      color: "white",
      fontWeight: "500",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "clamp(12px, 2vw, 14px)",
      transition: "all 0.2s",
      whiteSpace: "nowrap" as const,
    } as CSSProperties,

    danger: {
      background: colors.error[600],
      color: "white",
      fontWeight: "500",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "clamp(12px, 2vw, 14px)",
      transition: "all 0.2s",
      whiteSpace: "nowrap" as const,
    } as CSSProperties,

    disabled: {
      background: colors.gray[400],
      color: "white",
      fontWeight: "500",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "not-allowed",
      fontSize: "clamp(12px, 2vw, 14px)",
    } as CSSProperties,
  },

  badge: {
    success: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "9999px",
      fontSize: "clamp(11px, 1.5vw, 13px)",
      fontWeight: "600",
      background: colors.green[50],
      color: colors.green[800],
    } as CSSProperties,

    warning: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "9999px",
      fontSize: "clamp(11px, 1.5vw, 13px)",
      fontWeight: "600",
      background: colors.warning[100],
      color: colors.warning[800],
    } as CSSProperties,

    error: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "9999px",
      fontSize: "clamp(11px, 1.5vw, 13px)",
      fontWeight: "600",
      background: colors.error[100],
      color: colors.error[800],
    } as CSSProperties,

    primary: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "9999px",
      fontSize: "clamp(11px, 1.5vw, 13px)",
      fontWeight: "600",
      background: colors.primary[100],
      color: colors.primary[800],
    } as CSSProperties,

    gray: {
      display: "inline-flex" as const,
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "9999px",
      fontSize: "clamp(11px, 1.5vw, 13px)",
      fontWeight: "600",
      background: colors.gray[200],
      color: colors.gray[700],
    } as CSSProperties,
  },

  alert: {
    success: {
      marginBottom: "12px",
      padding: "10px 14px",
      background: colors.success[50],
      border: `1px solid ${colors.success[200]}`,
      borderRadius: "6px",
      color: colors.success[800],
      fontSize: "clamp(12px, 2vw, 14px)",
      wordBreak: "break-word" as const,
    } as CSSProperties,

    error: {
      marginBottom: "12px",
      padding: "10px 14px",
      background: colors.error[50],
      border: `1px solid ${colors.error[200]}`,
      borderRadius: "6px",
      color: colors.error[800],
      fontSize: "clamp(12px, 2vw, 14px)",
      wordBreak: "break-word" as const,
    } as CSSProperties,

    warning: {
      marginBottom: "12px",
      padding: "10px 14px",
      background: colors.warning[50],
      border: `1px solid ${colors.warning[300]}`,
      borderRadius: "6px",
      color: colors.warning[800],
      fontSize: "clamp(12px, 2vw, 14px)",
      wordBreak: "break-word" as const,
    } as CSSProperties,

    info: {
      marginBottom: "12px",
      padding: "10px 14px",
      background: colors.primary[50],
      border: `1px solid ${colors.primary[200]}`,
      borderRadius: "6px",
      color: colors.primary[800],
      fontSize: "clamp(12px, 2vw, 14px)",
      wordBreak: "break-word" as const,
    } as CSSProperties,
  },

  emptyState: {
    textAlign: "center" as const,
    padding: "32px 16px",
    color: colors.gray[400],
    background: colors.gray[50],
    borderRadius: "6px",
    border: `1px dashed ${colors.gray[300]}`,
    fontSize: "clamp(12px, 2vw, 14px)",
  } as CSSProperties,

  table: {
    container: {
      overflow: "auto",
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: "6px",
      WebkitOverflowScrolling: "touch" as const,
    } as CSSProperties,

    header: {
      padding: "10px 12px",
      textAlign: "left" as const,
      fontSize: "clamp(10px, 1.5vw, 11px)",
      fontWeight: "600",
      color: colors.gray[600],
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      whiteSpace: "nowrap" as const,
    } as CSSProperties,

    cell: {
      padding: "12px",
      fontSize: "clamp(12px, 2vw, 14px)",
      color: colors.gray[900],
      wordBreak: "break-word" as const,
    } as CSSProperties,

    row: {
      borderBottom: `1px solid ${colors.gray[100]}`,
      transition: "background 0.2s",
    } as CSSProperties,
  },

  modalOverlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "16px",
    boxSizing: "border-box" as const,
  } as CSSProperties,

  modalContent: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    maxWidth: "500px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    boxSizing: "border-box" as const,
  } as CSSProperties,

  modalTitle: {
    fontSize: "clamp(18px, 3vw, 24px)",
    fontWeight: "700",
    color: colors.gray[800],
    marginBottom: "8px",
  } as CSSProperties,

  grid: {
    twoColumn: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "16px",
    } as CSSProperties,

    threeColumn: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "12px",
    } as CSSProperties,

    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px",
    } as CSSProperties,
  },

  loading: {
    marginBottom: "12px",
    padding: "10px 14px",
    background: colors.gray[50],
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: "6px",
    color: colors.gray[500],
    fontSize: "clamp(12px, 2vw, 14px)",
  } as CSSProperties,

  divider: {
    borderTop: `1px solid ${colors.gray[200]}`,
    marginTop: "20px",
    marginBottom: "20px",
  } as CSSProperties,
};

export const getResponsiveGrid = (
  mobile: number = 1,
  tablet: number = 2,
  desktop: number = 3
): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: `repeat(${mobile}, 1fr)`,
  gap: "12px",
  "@media (min-width: 640px)": {
    gridTemplateColumns: `repeat(${tablet}, 1fr)`,
    gap: "16px",
  },
  "@media (min-width: 1024px)": {
    gridTemplateColumns: `repeat(${desktop}, 1fr)`,
    gap: "20px",
  },
} as CSSProperties & Record<string, CSSProperties>);

export const getHoverStyle = (baseColor: string, hoverColor: string) => ({
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.background = hoverColor;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
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
