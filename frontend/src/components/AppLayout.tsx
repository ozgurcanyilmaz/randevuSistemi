import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getRoles, logout } from "../services/auth";
import { api } from "../services/api";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";
import { colors } from "../styles/commonStyles";

type UserProfile = {
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  tcKimlikNo: string | null;
  gender: string | null;
  address: string | null;
  heightCm: number | null;
  weightKg: number | null;
};

export default function AppLayout({ children }: PropsWithChildren) {
  const roles = getRoles();
  const isAdmin = roles.includes("Admin");
  const isOperator = roles.includes("Operator");
  const isProvider = roles.includes("ServiceProvider");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [openDeps, setOpenDeps] = useState(false);
  const [openUsers, setOpenUsers] = useState(false);
  const [openOperatorAppt, setOpenOperatorAppt] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const adminDepartmentsMatch = useMemo(
    () => pathname.startsWith("/admin/departments"),
    [pathname]
  );
  const adminUsersMatch = useMemo(
    () => pathname.startsWith("/admin/roles"),
    [pathname]
  );
  const operatorApptMatch = useMemo(
    () => pathname.startsWith("/operator"),
    [pathname]
  );

  useEffect(() => {
    if (adminDepartmentsMatch) setOpenDeps(true);
    if (adminUsersMatch) setOpenUsers(true);
    if (operatorApptMatch) setOpenOperatorAppt(true);
  }, [adminDepartmentsMatch, adminUsersMatch, operatorApptMatch]);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data } = await api.get<UserProfile>("/user/profile");
        setUserProfile(data);
      } catch {
        const email = localStorage.getItem("email");
        if (email) {
          setUserProfile({ email, fullName: null, phoneNumber: null, tcKimlikNo: null, gender: null, address: null, heightCm: null, weightKg: null });
        }
      } finally {
        setLoadingProfile(false);
      }
    }
    loadUserProfile();
  }, []);

  const getUserDisplayName = () => {
    if (userProfile?.fullName) {
      return userProfile.fullName;
    }
    return userProfile?.email || localStorage.getItem("email") || "Kullanıcı";
  };

  const adminRootActive = pathname === "/admin";
  const providerRootActive = pathname === "/provider/appointments";
  const operatorRootActive =
    pathname === "/operator" || pathname === "/operator/appointments";

  const goHome = () => {
    const homePath = isAdmin
      ? "/admin"
      : isOperator
      ? "/operator"
      : isProvider
      ? "/provider/appointments"
      : "/";
    navigate(homePath);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarOpen && isMobile) {
        const sidebar = document.querySelector('aside');
        const hamburger = document.querySelector('button[aria-label="Menüyü Aç/Kapat"]');
        const target = e.target as HTMLElement;
        if (sidebar && !sidebar.contains(target) && hamburger && !hamburger.contains(target)) {
          setSidebarOpen(false);
        }
      }
    };
    if (sidebarOpen && isMobile) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [sidebarOpen, isMobile]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: isMobile ? 0 : "260px",
          right: 0,
          height: "60px",
          background: "white",
          borderBottom: `1px solid ${colors.gray[200]}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 999,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          transition: "left 0.3s ease-in-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: colors.gray[700],
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.gray[100];
                e.currentTarget.style.color = colors.gray[900];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.gray[700];
              }}
              aria-label="Menüyü Aç/Kapat"
              title="Menüyü Aç/Kapat"
            >
              <span style={{ fontSize: "20px" }}>☰</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              goHome();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: colors.gray[700],
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.gray[100];
              e.currentTarget.style.color = colors.primary[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = colors.gray[700];
            }}
            aria-label="Anasayfa"
            title="Anasayfa"
          >
            <span style={{ fontSize: "18px" }}>🏠︎</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isProvider && (
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate("/provider");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: colors.gray[700],
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.gray[100];
                e.currentTarget.style.color = colors.primary[600];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.gray[700];
              }}
              title="Parametreler"
            >
              <span style={{ fontSize: "18px" }}>⚙️</span>
            </button>
          )}

          {!isAdmin && !isProvider && !isOperator && (
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate("/profile");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: colors.gray[700],
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.gray[100];
                e.currentTarget.style.color = colors.primary[600];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.gray[700];
              }}
              title="Profilim"
            >
              <span style={{ fontSize: "18px" }}>👤</span>
            </button>
          )}

          <button
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: `1px solid ${colors.gray[300]}`,
              background: "transparent",
              cursor: "pointer",
              color: colors.gray[700],
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.error[50];
              e.currentTarget.style.borderColor = colors.error[300];
              e.currentTarget.style.color = colors.error[700];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = colors.gray[300];
              e.currentTarget.style.color = colors.gray[700];
            }}
          >
            <span style={{ fontSize: "16px" }}>➜]</span>
            <span>Çıkış</span>
          </button>
        </div>
      </nav>

      <aside 
        style={{
          width: "260px",
          background: `linear-gradient(180deg, ${colors.gray[800]} 0%, ${colors.gray[900]} 100%)`,
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          zIndex: 1001,
          ...(isMobile ? {
            left: sidebarOpen ? 0 : '-260px',
            transition: 'left 0.3s ease-in-out',
          } : {}),
        }}
      >
        <div
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
          style={{
            padding: "20px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${colors.primary[500]}4D`,
            }}
          >
            📅
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#fff",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginBottom: "4px",
              }}
            >
              Randevu Sistemi
            </div>
            {!loadingProfile && (
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255, 255, 255, 0.6)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {getUserDisplayName()}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "16px 0" }}>
          <nav>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
              role="menu"
            >
              {!isAdmin && !isProvider && !isOperator && (
                <>
                  <li>
                    <NavLink
                      to="/"
                      end
                      className={() => ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: pathname === "/" ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: pathname === "/" ? `${colors.primary[500]}33` : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: pathname === "/" ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: pathname === "/" ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== "/") {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== "/") {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>🔍</span>
                      <span>Randevu Al</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/my-appointments"
                      end
                      className={() => ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: pathname === "/my-appointments" ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: pathname === "/my-appointments" ? "rgba(59, 130, 246, 0.2)" : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: pathname === "/my-appointments" ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: pathname === "/my-appointments" ? "3px solid #3b82f6" : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== "/my-appointments") {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== "/my-appointments") {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>📅</span>
                      <span>Randevularım</span>
                    </NavLink>
                  </li>
                </>
              )}

              {isAdmin && (
                <>
                  <li style={{ padding: "8px 16px", marginTop: "8px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "rgba(255, 255, 255, 0.5)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Admin
                    </div>
                  </li>

                  <li>
                    <NavLink
                      to="/admin"
                      end
                      className={() => ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: (pathname === "/admin" || adminRootActive) ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: (pathname === "/admin" || adminRootActive) ? `${colors.primary[500]}33` : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: (pathname === "/admin" || adminRootActive) ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: (pathname === "/admin" || adminRootActive) ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== "/admin" && !adminRootActive) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== "/admin" && !adminRootActive) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>📊</span>
                      <span>Yönetim Özeti</span>
                    </NavLink>
                  </li>

                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenDeps((v) => !v);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: openDeps ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: openDeps ? `${colors.primary[500]}33` : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: openDeps ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: openDeps ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        if (!openDeps) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!openDeps) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                        <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>🏢</span>
                        <span>Departman Yönetimi</span>
                      </div>
                      <span style={{ fontSize: "12px", transition: "transform 0.2s", transform: openDeps ? "rotate(-90deg)" : "rotate(0deg)" }}>
                        ▶
                      </span>
                    </a>
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "4px 0 0 0",
                        padding: "0 0 0 8px",
                        display: openDeps ? "block" : "none",
                        borderLeft: "2px solid rgba(255, 255, 255, 0.1)",
                        marginLeft: "24px",
                      }}
                    >
                      <li>
                        <NavLink
                          to="/admin/departments"
                          end
                          className={() => ""}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 16px",
                            margin: "2px 0",
                            borderRadius: "6px",
                            color: pathname === "/admin/departments" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                            background: pathname === "/admin/departments" ? `${colors.primary[500]}26` : "transparent",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: pathname === "/admin/departments" ? 600 : 500,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== "/admin/departments") {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pathname !== "/admin/departments") {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>•</span>
                          <span>Departmanlar</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/admin/departments/branches"
                          end
                          className={() => ""}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 16px",
                            margin: "2px 0",
                            borderRadius: "6px",
                            color: pathname === "/admin/departments/branches" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                            background: pathname === "/admin/departments/branches" ? `${colors.primary[500]}26` : "transparent",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: pathname === "/admin/departments/branches" ? 600 : 500,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== "/admin/departments/branches") {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pathname !== "/admin/departments/branches") {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>•</span>
                          <span>Şube Yönetimi</span>
                        </NavLink>
                      </li>
                    </ul>
                  </li>

                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenUsers((v) => !v);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: openUsers ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: openUsers ? "rgba(59, 130, 246, 0.2)" : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: openUsers ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: openUsers ? "3px solid #3b82f6" : "3px solid transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        if (!openUsers) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!openUsers) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                        <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>👥</span>
                        <span>Kullanıcı Yönetimi</span>
                      </div>
                      <span style={{ fontSize: "12px", transition: "transform 0.2s", transform: openUsers ? "rotate(-90deg)" : "rotate(0deg)" }}>
                        ▶
                      </span>
                    </a>
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "4px 0 0 0",
                        padding: "0 0 0 8px",
                        display: openUsers ? "block" : "none",
                        borderLeft: "2px solid rgba(255, 255, 255, 0.1)",
                        marginLeft: "24px",
                      }}
                    >
                      <li>
                        <NavLink
                          to="/admin/roles/user-operations"
                          end
                          className={() => ""}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 16px",
                            margin: "2px 0",
                            borderRadius: "6px",
                            color: pathname === "/admin/roles/user-operations" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                            background: pathname === "/admin/roles/user-operations" ? `${colors.primary[500]}26` : "transparent",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: pathname === "/admin/roles/user-operations" ? 600 : 500,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== "/admin/roles/user-operations") {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pathname !== "/admin/roles/user-operations") {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>•</span>
                          <span>Kullanıcı İşlemleri</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/admin/roles"
                          end
                          className={() => ""}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 16px",
                            margin: "2px 0",
                            borderRadius: "6px",
                            color: pathname === "/admin/roles" && !pathname.includes("/admin/roles/") ? "#fff" : "rgba(255, 255, 255, 0.6)",
                            background: pathname === "/admin/roles" && !pathname.includes("/admin/roles/") ? `${colors.primary[500]}26` : "transparent",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: pathname === "/admin/roles" && !pathname.includes("/admin/roles/") ? 600 : 500,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== "/admin/roles" || pathname.includes("/admin/roles/")) {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pathname !== "/admin/roles" || pathname.includes("/admin/roles/")) {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>•</span>
                          <span>Rol Atama</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/admin/roles/assign-provider"
                          end
                          className={() => ""}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 16px",
                            margin: "2px 0",
                            borderRadius: "6px",
                            color: pathname === "/admin/roles/assign-provider" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                            background: pathname === "/admin/roles/assign-provider" ? `${colors.primary[500]}26` : "transparent",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: pathname === "/admin/roles/assign-provider" ? 600 : 500,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== "/admin/roles/assign-provider") {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pathname !== "/admin/roles/assign-provider") {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>•</span>
                          <span>İlgiliyi Şubeye Atama</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/admin/roles/assign-operator"
                          end
                          className={() => ""}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 16px",
                            margin: "2px 0",
                            borderRadius: "6px",
                            color: pathname === "/admin/roles/assign-operator" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                            background: pathname === "/admin/roles/assign-operator" ? `${colors.primary[500]}26` : "transparent",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: pathname === "/admin/roles/assign-operator" ? 600 : 500,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== "/admin/roles/assign-operator") {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pathname !== "/admin/roles/assign-operator") {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>•</span>
                          <span>Operatörü Şubeye Atama</span>
                        </NavLink>
                      </li>
                    </ul>
                  </li>
                </>
              )}

              {isOperator && (
                <>
                  <li style={{ padding: "8px 16px", marginTop: "8px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "rgba(255, 255, 255, 0.5)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Operatör
                    </div>
                  </li>

                  <li>
                    <NavLink
                      to="/operator/dashboard"
                      end
                      className={() => ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: (pathname === "/operator/dashboard" || operatorRootActive) ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: (pathname === "/operator/dashboard" || operatorRootActive) ? `${colors.primary[500]}33` : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: (pathname === "/operator/dashboard" || operatorRootActive) ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: (pathname === "/operator/dashboard" || operatorRootActive) ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== "/operator/dashboard" && !operatorRootActive) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== "/operator/dashboard" && !operatorRootActive) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>📊</span>
                      <span>Operatör Özeti</span>
                    </NavLink>
                  </li>

                  <li>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenOperatorAppt((v) => !v);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: openOperatorAppt ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: openOperatorAppt ? `${colors.primary[500]}33` : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: openOperatorAppt ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: openOperatorAppt ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        if (!openOperatorAppt) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!openOperatorAppt) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                        <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>📋</span>
                        <span>Randevu Yönetimi</span>
                      </div>
                      <span style={{ fontSize: "12px", transition: "transform 0.2s", transform: openOperatorAppt ? "rotate(-90deg)" : "rotate(0deg)" }}>
                        ▶
                      </span>
                    </a>
                    <ul
                      style={{
                        listStyle: "none",
                        margin: "4px 0 0 0",
                        padding: "0 0 0 8px",
                        display: openOperatorAppt ? "block" : "none",
                        borderLeft: "2px solid rgba(255, 255, 255, 0.1)",
                        marginLeft: "24px",
                      }}
                    >
                      <li>
                        <NavLink
                          to="/operator/appointments"
                          end
                          className={() => ""}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 16px",
                            margin: "2px 0",
                            borderRadius: "6px",
                            color: pathname === "/operator/appointments" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                            background: pathname === "/operator/appointments" ? `${colors.primary[500]}26` : "transparent",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: pathname === "/operator/appointments" ? 600 : 500,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== "/operator/appointments") {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pathname !== "/operator/appointments") {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>•</span>
                          <span>Randevu İşlemleri</span>
                        </NavLink>
                      </li>
                      <li>
                        <NavLink
                          to="/operator/walk-in"
                          end
                          className={() => ""}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 16px",
                            margin: "2px 0",
                            borderRadius: "6px",
                            color: pathname === "/operator/walk-in" ? "#fff" : "rgba(255, 255, 255, 0.6)",
                            background: pathname === "/operator/walk-in" ? `${colors.primary[500]}26` : "transparent",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: pathname === "/operator/walk-in" ? 600 : 500,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (pathname !== "/operator/walk-in") {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (pathname !== "/operator/walk-in") {
                              e.currentTarget.style.background = "transparent";
                            }
                          }}
                        >
                          <span style={{ fontSize: "12px", width: "16px", textAlign: "center" }}>•</span>
                          <span>Randevusuz Kabul</span>
                        </NavLink>
                      </li>
                    </ul>
                  </li>
                </>
              )}

              {isProvider && (
                <>
                  <li style={{ padding: "8px 16px", marginTop: "8px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "rgba(255, 255, 255, 0.5)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      İlgili
                    </div>
                  </li>
                  <li>
                    <NavLink
                      to="/provider/appointments"
                      end
                      className={() => ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: (pathname === "/provider/appointments" || providerRootActive) ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: (pathname === "/provider/appointments" || providerRootActive) ? `${colors.primary[500]}33` : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: (pathname === "/provider/appointments" || providerRootActive) ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: (pathname === "/provider/appointments" || providerRootActive) ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== "/provider/appointments" && !providerRootActive) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== "/provider/appointments" && !providerRootActive) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>📅</span>
                      <span>Randevular</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/provider/sessions"
                      end
                      className={() => ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: pathname === "/provider/sessions" ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: pathname === "/provider/sessions" ? `${colors.primary[500]}33` : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: pathname === "/provider/sessions" ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: pathname === "/provider/sessions" ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== "/provider/sessions") {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== "/provider/sessions") {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>📄</span>
                      <span>Görüşmeler</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/provider/waiting"
                      end
                      className={() => ""}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 16px",
                        margin: "0 8px",
                        borderRadius: "8px",
                        color: pathname === "/provider/waiting" ? "#fff" : "rgba(255, 255, 255, 0.7)",
                        background: pathname === "/provider/waiting" ? `${colors.primary[500]}33` : "transparent",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: pathname === "/provider/waiting" ? 600 : 500,
                        transition: "all 0.2s",
                        borderLeft: pathname === "/provider/waiting" ? `3px solid ${colors.primary[500]}` : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (pathname !== "/provider/waiting") {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (pathname !== "/provider/waiting") {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>👥</span>
                      <span>Bekleyen Ziyaretçiler</span>
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </aside>

      <div 
        style={{
          marginLeft: isMobile ? 0 : "260px",
          marginTop: "60px",
          minHeight: "calc(100vh - 60px)",
          transition: "margin-left 0.3s ease-in-out",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        {sidebarOpen && isMobile && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {children}
      </div>
    </div>
  );
}
