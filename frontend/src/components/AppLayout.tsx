import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { getRoles, logout } from "../services/auth";
import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useState } from "react";

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
        const sidebar = document.querySelector('.main-sidebar');
        const hamburger = document.querySelector('.nav-link[aria-label="Menüyü Aç/Kapat"]');
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
    <div className={`wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        <ul className="navbar-nav">
          <li className="nav-item">
            <a
              href="#"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                toggleSidebar();
              }}
              role="button"
              aria-label="Menüyü Aç/Kapat"
              title="Menüyü Aç/Kapat"
              style={{
                display: isMobile ? 'block' : 'none',
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              <i className="fas fa-bars" />
            </a>
          </li>
          <li className="nav-item">
            <a
              href="#"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                goHome();
              }}
              role="button"
              aria-label="Anasayfa"
              title="Anasayfa"
            >
              <i className="fas fa-home" />
            </a>
          </li>
        </ul>
        <ul className="navbar-nav ml-auto">
          {isProvider && (
            <li className="nav-item">
              <a
                href="#"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/provider");
                }}
                title="Parametreler"
              >
                <i className="fas fa-cog" />
              </a>
            </li>
          )}

          {!isAdmin && !isProvider && !isOperator && (
            <li className="nav-item">
              <a
                href="#"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/profile");
                }}
                title="Profilim"
              >
                <i className="fas fa-user" />
              </a>
            </li>
          )}

          <li className="nav-item">
            <button
              className="btn btn-outline-secondary border"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              <i className="fas fa-sign-out-alt" /> Çıkış Yap
            </button>
          </li>
        </ul>
      </nav>

      <aside 
        className="main-sidebar sidebar-dark-secondary elevation-4"
        style={{
          ...(isMobile ? {
            position: 'fixed',
            top: 0,
            left: sidebarOpen ? 0 : '-250px',
            zIndex: 1030,
            transition: 'left 0.3s ease-in-out',
            height: '100vh',
            overflowY: 'auto',
          } : {}),
        }}
      >
        <a
          href="#"
          className="brand-link"
          onClick={(e) => {
            e.preventDefault();
            goHome();
          }}
          title="Randevu Sistemi"
        >
          <span className="brand-text font-weight-light">Randevu Sistemi</span>
        </a>

        <div className="sidebar">
          <nav className="mt-2">
            <ul
              className="nav nav-pills nav-sidebar flex-column"
              role="menu"
              data-accordion="false"
            >
              {!isAdmin && !isProvider && !isOperator && (
                <>
                  <li className="nav-item">
                    <NavLink
                      to="/"
                      end
                      className={({ isActive }) =>
                        `nav-link${isActive ? " active" : ""}`
                      }
                    >
                      <i className="nav-icon fas fa-search" />
                      <p>Randevu Al</p>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/my-appointments"
                      end
                      className={({ isActive }) =>
                        `nav-link${isActive ? " active" : ""}`
                      }
                    >
                      <i className="nav-icon fas fa-calendar" />
                      <p>Randevularım</p>
                    </NavLink>
                  </li>
                </>
              )}

              {isAdmin && (
                <>
                  <li className="nav-header">Admin</li>

                  <li className="nav-item">
                    <NavLink
                      to="/admin"
                      end
                      className={({ isActive }) =>
                        `nav-link${
                          isActive || adminRootActive ? " active" : ""
                        }`
                      }
                    >
                      <i className="nav-icon fas fa-tachometer-alt" />
                      <p>Yönetim Özeti</p>
                    </NavLink>
                  </li>

                  <li
                    className={`nav-item has-treeview ${
                      openDeps ? "menu-open" : ""
                    }`}
                  >
                    <a
                      href="#"
                      className={`nav-link ${openDeps ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenDeps((v) => !v);
                      }}
                      aria-expanded={openDeps}
                    >
                      <i className="nav-icon fas fa-project-diagram" />
                      <p>
                        Departman Yönetimi
                        <i className="right fas fa-angle-left" />
                      </p>
                    </a>
                    <ul
                      className="nav nav-treeview"
                      style={{ display: openDeps ? "block" : "none" }}
                    >
                      <li className="nav-item">
                        <NavLink
                          to="/admin/departments"
                          end
                          className={({ isActive }) =>
                            `nav-link${isActive ? " active" : ""}`
                          }
                        >
                          <i className="far fa-circle nav-icon" />
                          <p>Departmanlar</p>
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink
                          to="/admin/departments/branches"
                          end
                          className={({ isActive }) =>
                            `nav-link${isActive ? " active" : ""}`
                          }
                        >
                          <i className="far fa-circle nav-icon" />
                          <p>Şube Yönetimi</p>
                        </NavLink>
                      </li>
                    </ul>
                  </li>

                  <li
                    className={`nav-item has-treeview ${
                      openUsers ? "menu-open" : ""
                    }`}
                  >
                    <a
                      href="#"
                      className={`nav-link ${openUsers ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenUsers((v) => !v);
                      }}
                      aria-expanded={openUsers}
                    >
                      <i className="nav-icon fas fa-users" />
                      <p>
                        Kullanıcı Yönetimi
                        <i className="right fas fa-angle-left" />
                      </p>
                    </a>
                    <ul
                      className="nav nav-treeview"
                      style={{ display: openUsers ? "block" : "none" }}
                    >
                      <li className="nav-item">
                        <NavLink
                          to="/admin/roles"
                          end
                          className={({ isActive }) =>
                            `nav-link${isActive ? " active" : ""}`
                          }
                        >
                          <i className="far fa-circle nav-icon" />
                          <p>Rol Atama</p>
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink
                          to="/admin/roles/assign-provider"
                          end
                          className={({ isActive }) =>
                            `nav-link${isActive ? " active" : ""}`
                          }
                        >
                          <i className="far fa-circle nav-icon" />
                          <p>İlgiliyi Şubeye Atama</p>
                        </NavLink>
                      </li>
                    </ul>
                  </li>
                </>
              )}

              {isOperator && (
                <>
                  <li className="nav-header">Operatör</li>

                  <li className="nav-item">
                    <NavLink
                      to="/operator/dashboard"
                      end
                      className={({ isActive }) =>
                        `nav-link${
                          isActive || operatorRootActive ? " active" : ""
                        }`
                      }
                    >
                      <i className="nav-icon fas fa-tachometer-alt" />
                      <p>Operatör Özeti</p>
                    </NavLink>
                  </li>

                  <li
                    className={`nav-item has-treeview ${
                      openOperatorAppt ? "menu-open" : ""
                    }`}
                  >
                    <a
                      href="#"
                      className={`nav-link ${openOperatorAppt ? "active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenOperatorAppt((v) => !v);
                      }}
                      aria-expanded={openOperatorAppt}
                    >
                      <i className="nav-icon fas fa-calendar-check" />
                      <p>
                        Randevu Yönetimi
                        <i className="right fas fa-angle-left" />
                      </p>
                    </a>
                    <ul
                      className="nav nav-treeview"
                      style={{ display: openOperatorAppt ? "block" : "none" }}
                    >
                      <li className="nav-item">
                        <NavLink
                          to="/operator/appointments"
                          end
                          className={({ isActive }) =>
                            `nav-link${isActive ? " active" : ""}`
                          }
                        >
                          <i className="far fa-circle nav-icon" />
                          <p>Randevu İşlemleri</p>
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink
                          to="/operator/walk-in"
                          end
                          className={({ isActive }) =>
                            `nav-link${isActive ? " active" : ""}`
                          }
                        >
                          <i className="far fa-circle nav-icon" />
                          <p>Walk-in Randevu</p>
                        </NavLink>
                      </li>
                    </ul>
                  </li>
                </>
              )}

              {isProvider && (
                <>
                  <li className="nav-header">İlgili</li>
                  <li className="nav-item">
                    <NavLink
                      to="/provider/appointments"
                      end
                      className={({ isActive }) =>
                        `nav-link${
                          isActive || providerRootActive ? " active" : ""
                        }`
                      }
                    >
                      <i className="nav-icon fas fa-calendar-day" />
                      <p>Randevular</p>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/provider/sessions"
                      end
                      className={({ isActive }) =>
                        `nav-link${isActive ? " active" : ""}`
                      }
                    >
                      <i className="nav-icon fas fa-clipboard-list" />
                      <p>Görüşmeler</p>
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      to="/provider/waiting"
                      end
                      className={({ isActive }) =>
                        `nav-link${isActive ? " active" : ""}`
                      }
                    >
                      <i className="nav-icon fas fa-users" />
                      <p>Bekleyen Ziyaretçiler</p>
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </aside>

      <div className="content-wrapper">
        {sidebarOpen && isMobile && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1029,
            }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <section className="content pt-3">
          <div className="container-fluid">{children}</div>
        </section>
      </div>
    </div>
  );
}
