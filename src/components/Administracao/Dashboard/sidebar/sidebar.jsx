import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./sidebar.module.css";
// Icons
import { RxDashboard } from "react-icons/rx";
import {
  FaBoxOpen,
  FaShoppingBag,
  FaSignOutAlt,
  FaChevronRight,
  FaUserFriends,
  FaTags,
} from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import { TbReportAnalytics } from "react-icons/tb";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Carregar usuário do localStorage
    try {
      const raw = localStorage.getItem("smilepet_admin");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Erro ao ler admin user", e);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("smilepet_admin");
    // Disparar evento para atualizar a app (se necessário, como visto em admPage.jsx)
    window.dispatchEvent(new Event("smilepet_admin_changed"));
    window.dispatchEvent(new Event("storage"));
    navigate("/adm/login");
  };

  const menuItems = [
    {
      label: "Todas as páginas",
      path: "/adm/home",
      icon: <RxDashboard />,
    },
    {
      label: "Clientes",
      path: "/adm/clientes",
      icon: <FaUserFriends />,
    },
    {
      label: "Produtos",
      path: "/adm/produtos",
      icon: <FaBoxOpen />,
    },
    {
      label: "Categorias",
      path: "/adm/categorias", // Rota a ser criada futuramente
      icon: <BiCategory />,
    },
    {
      label: "Cupons de Desconto",
      path: "/adm/cupons", // Linkando para cupons por enquanto
      icon: <FaTags />,
    },
    {
      label: "Vendas",
      path: "/adm/vendas",
      icon: <FaShoppingBag />,
    },
    {
      label: "Relatórios",
      path: "/adm/relatorios",
      icon: <TbReportAnalytics />,
    },
  ];

  const getInitials = (name) => {
    if (!name) return "A";
    return name.charAt(0).toUpperCase();
  };

  return (
    <aside className={styles.sidebar}>
      {/* Header / Logo */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logoContainer}>
          {/* Simulando logo simples com texto ou ícone para o painel */}
          <div className={styles.msgLogo}>SmilePet</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.navContainer}>
        <ul className={styles.navList}>
          <li className={styles.navGroupTitle}>PRINCIPAL</li>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <li key={item.path} className={styles.navItem}>
                <button
                  className={`${styles.navLink} ${
                    isActive ? styles.active : ""
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <span className={styles.icon}>{item.icon}</span>
                  <span className={styles.label}>{item.label}</span>
                  {isActive && <div className={styles.activeIndicator} />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer */}
      <div className={styles.sidebarFooter}>
        <div
          className={styles.userProfile}
          onClick={() => setShowUserMenu(!showUserMenu)}
          role="button"
          tabIndex={0}
        >
          <div className={styles.avatar}>
            {getInitials(user?.usuario?.login || user?.login || user?.email)}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user?.usuario?.login || user?.login || "Admin"}
            </span>
            <span className={styles.userRole}>Administrador</span>
          </div>

          <div className={styles.userChevron}>
            {showUserMenu ? <IoIosArrowDown /> : <IoIosArrowUp />}
          </div>

          {/* Popover Menu Logout */}
          {showUserMenu && (
            <div className={styles.userMenuPopover}>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <FaSignOutAlt style={{ marginRight: 8 }} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
