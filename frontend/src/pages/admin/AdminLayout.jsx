import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, GraduationCap, Receipt, Star, LifeBuoy, Settings, LogOut, Moon, Sun, Languages, Menu, Home, HelpCircle, Award, PenSquare } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Logo } from "../../components/ui";

export default function AdminLayout() {
  const { t, theme, toggleTheme, lang, toggleLang } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const items = [
    ["/admin", LayoutDashboard, "Dashboard", true], ["/admin/courses", BookOpen, "Courses"], ["/admin/instructors", GraduationCap, "Instructors"],
    ["/admin/students", Users, "Students"], ["/admin/quizzes", HelpCircle, "Quizzes"], ["/admin/certificates", Award, "Certificates"], ["/admin/orders", Receipt, "Orders"], ["/admin/reviews", Star, "Reviews"],
    ["/admin/content", PenSquare, "Website Content"],
    ["/admin/support", LifeBuoy, "Support"], ["/admin/settings", Settings, "Settings"]
  ];
  return (
    <div className="admin-shell">
      <aside className={`admin-side ${open ? "open" : ""}`}>
        <Logo light to="/admin" />
        <nav>
          {items.map(([to, I, label, end]) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `admin-link ${isActive ? "active" : ""}`}><I size={18} /> {t(label)}</NavLink>)}
        </nav>
        <Link to="/" className="admin-link"><Home size={18} /> {t("View website")}</Link>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Menu"><Menu size={20} /></button>
          <h2 className="admin-top-title">{t("Admin Dashboard")}</h2>
          <div className="nav-actions">
            <button className="icon-btn" onClick={toggleLang}><Languages size={18} /><span className="lang-tag">{lang === "en" ? "AR" : "EN"}</span></button>
            <button className="icon-btn" onClick={toggleTheme} aria-label="Theme">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
            <Avatar src={user.avatar} name={user.name} size={36} />
            <button className="icon-btn" onClick={() => { logout(); navigate("/"); }} aria-label={t("Log out")} title={t("Log out")}><LogOut size={18} /></button>
          </div>
        </header>
        <div className="admin-content page-anim" key={pathname}><Outlet /></div>
      </div>
    </div>
  );
}
