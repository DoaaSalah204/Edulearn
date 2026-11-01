import { useEffect, useRef, useState } from "react";
import { useMotionEngine } from "./Motion";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Moon, Sun, Bell, Menu, X, Languages, LogOut, LayoutDashboard, Heart, Award, Receipt, User, BookOpen, Settings, ShieldCheck, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { Avatar, Logo } from "./ui";

export function Navbar() {
  const { t, theme, toggleTheme, lang, toggleLang, toast } = useApp();
  const { user, logout } = useAuth();
  const { cart } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const menuRef = useRef(null);

  useEffect(() => { setOpen(false); setMenu(false); }, [location.pathname]);
  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submit = (e) => { e.preventDefault(); navigate(`/courses${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ""}`); setOpen(false); };
  const links = [["/", "Home"], ["/courses", "Courses"], ["/instructors", "Instructors"], ["/about", "About"], ["/contact", "Contact"]];

  return (
    <header className="nav">
      <div className="container nav-inner">
        <button className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
        <Logo />
        <nav className={`nav-links ${open ? "open" : ""}`} aria-label="Main">
          {links.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>{t(label)}</NavLink>)}
          <form className="search-pill mobile-only" onSubmit={submit}><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search courses...")} /></form>
        </nav>
        <div className="nav-actions">
          <form className="search-pill desktop-only" onSubmit={submit} role="search"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search courses...")} aria-label={t("Search courses...")} /></form>
          <button className="icon-btn" onClick={toggleLang} title={t("Language")} aria-label="Language"><Languages size={18} /><span className="lang-tag">{lang === "en" ? "AR" : "EN"}</span></button>
          <button className="icon-btn" onClick={toggleTheme} title={t("Theme")} aria-label="Theme">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
          <Link to="/cart" className="icon-btn" aria-label={t("Cart")}><ShoppingCart size={18} />{cart.length > 0 && <span className="count">{cart.length}</span>}</Link>
          {user ? (
            <>
              <button className="icon-btn desktop-only" onClick={() => toast(t("You're all caught up!"), "info")} aria-label="Notifications"><Bell size={18} /></button>
              <div className="user-menu" ref={menuRef}>
                <button className="avatar-btn" onClick={() => setMenu(!menu)} aria-label="Account" aria-expanded={menu}><Avatar src={user.avatar} name={user.name} size={38} /></button>
                {menu && (
                  <div className="dropdown">
                    <div className="dropdown-head"><b>{user.name}</b><small className="muted">{user.email}</small></div>
                    {user.role === "admin" && <Link to="/admin"><ShieldCheck size={16} /> {t("Admin Dashboard")}</Link>}
                    <Link to="/my-learning"><BookOpen size={16} /> {t("My Learning")}</Link>
                    <Link to="/wishlist"><Heart size={16} /> {t("Wishlist")}</Link>
                    <Link to="/certificates"><Award size={16} /> {t("Certificates")}</Link>
                    <Link to="/orders"><Receipt size={16} /> {t("Order History")}</Link>
                    <Link to="/profile"><Settings size={16} /> {t("Profile Settings")}</Link>
                    <button onClick={() => { logout(); navigate("/"); toast(t("Signed out.")); }}><LogOut size={16} /> {t("Log out")}</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn outline sm desktop-only">{t("Log In")}</Link>
              <Link to="/signup" className="btn primary sm">{t("Sign Up")}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const { t, content, settings } = useApp();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted">{t(content.footerText)}</p>
          <div className="socials">{[[Facebook, "facebook"], [Twitter, "twitter"], [Linkedin, "linkedin"], [Youtube, "youtube"]].filter(([, k]) => content.social[k]).map(([I, k]) => <a key={k} href={content.social[k]} target="_blank" rel="noreferrer" aria-label={k}><I size={16} /></a>)}</div>
        </div>
        <div><h4>{t("Company")}</h4><Link to="/about">{t("About")}</Link><Link to="/instructors">{t("Instructors")}</Link><Link to="/contact">{t("Contact")}</Link></div>
        <div><h4>{t("Learning")}</h4><Link to="/courses">{t("Courses")}</Link><Link to="/my-learning">{t("My Learning")}</Link><Link to="/certificates">{t("Certificates")}</Link><Link to="/wishlist">{t("Wishlist")}</Link></div>
        <div><h4>{t("Support")}</h4><Link to="/help">{t("Help & Support")}</Link><Link to="/contact">{t("Contact Us")}</Link><Link to="/signin">{t("Log In")}</Link></div>
      </div>
      <div className="container footer-bottom"><small className="muted">© {new Date().getFullYear()} {settings.platformName || "EduLearn"}. {t("All rights reserved.")}</small></div>
    </footer>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useMotionEngine();
  return (
    <div className="site">
      <div className="scroll-progress" aria-hidden="true" />
      <Navbar />
      <main key={pathname} className="page-anim"><Outlet /></main>
      <Footer />
    </div>
  );
}

/** Sidebar used by My Learning, Certificates, Wishlist, Orders and Profile */
export function AccountLayout() {
  const { t } = useApp();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const items = [
    ["/my-learning", LayoutDashboard, "My Learning"], ["/certificates", Award, "My Certificates"], ["/wishlist", Heart, "Wishlist"],
    ["/orders", Receipt, "Order History"], ["/profile", User, "Profile Settings"]
  ];
  return (
    <div className="container account-grid">
      <aside className="side-nav card">
        <div className="side-user"><Avatar src={user?.avatar} name={user?.name} size={56} /><b>{user?.name}</b><small className="muted">{user?.email}</small></div>
        {items.map(([to, I, label]) => <NavLink key={to} to={to} className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}><I size={17} /> {t(label)}</NavLink>)}
        <NavLink to="/help" className="side-link"><Settings size={17} /> {t("Help & Support")}</NavLink>
      </aside>
      <section className="account-main page-anim" key={pathname}><Outlet /></section>
    </div>
  );
}
