import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star, X, GraduationCap, AlertCircle, Eye, EyeOff, Lock, Upload } from "lucide-react";
import { useApp } from "../context/AppContext";

export function Logo({ to = "/", light = false }) {
  return (
    <Link to={to} className={`logo ${light ? "light" : ""}`} aria-label="EduLearn">
      <span className="logo-mark"><GraduationCap size={20} /></span>
      <span>Edu<b>Learn</b></span>
    </Link>
  );
}

export function Stars({ value = 0, size = 14 }) {
  return (
    <span className="stars" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(value) ? "currentColor" : "none"} className={n <= Math.round(value) ? "on" : ""} />
      ))}
    </span>
  );
}

export function Avatar({ src, name = "", size = 40, className = "" }) {
  const [broken, setBroken] = useState(false);
  const initials = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "U";
  const style = { width: size, height: size, fontSize: size * 0.38 };
  return src && !broken
    ? <img className={`avatar ${className}`} style={style} src={src} alt={name} onError={() => setBroken(true)} loading="lazy" />
    : <span className={`avatar fallback ${className}`} style={style} aria-label={name}>{initials}</span>;
}

export function Thumb({ src, alt = "", className = "" }) {
  const [broken, setBroken] = useState(false);
  return broken || !src
    ? <div className={`thumb-fallback ${className}`} role="img" aria-label={alt}><GraduationCap size={32} /></div>
    : <img className={className} src={src} alt={alt} onError={() => setBroken(true)} loading="lazy" />;
}

export function Spinner({ label, cards }) {
  const { t } = useApp();
  if (cards) return <div className="skel-grid" role="status" aria-label={t("Loading...")}>{[0, 1, 2, 3].map((i) => <div key={i} className="skel-card" style={{ "--i": i }}><div className="skel skel-img" /><div className="skel skel-line" /><div className="skel skel-line short" /></div>)}</div>;
  return <div className="spinner-wrap"><span className="spinner" /><span>{label || t("Loading...")}</span></div>;
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useApp();
  return (
    <div className="empty error-box">
      <AlertCircle size={34} />
      <h3>{t("Something went wrong")}</h3>
      <p className="muted">{message}</p>
      {onRetry && <button className="btn outline" onClick={onRetry}>{t("Try again")}</button>}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && <Icon size={36} />}
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

export function PageTitle({ title, sub, action }) {
  return (
    <div className="page-title">
      <div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div>
      {action}
    </div>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i}>{it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}{i < items.length - 1 && <span className="sep">›</span>}</span>
      ))}
    </nav>
  );
}

export function ProgressBar({ value }) {
  return <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${value}%` }} /></div>;
}

/** Password field with a show / hide button. Use it everywhere a password is typed. */
export function PasswordInput({ icon = false, className = "input", ...props }) {
  const { t } = useApp();
  const [show, setShow] = useState(false);
  const btn = (
    <button type="button" className="eye" onClick={() => setShow((v) => !v)} aria-label={show ? t("Hide password") : t("Show password")} title={show ? t("Hide password") : t("Show password")} tabIndex={0}>
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
  return icon
    ? <div className="input-icon"><Lock size={16} /><input {...props} type={show ? "text" : "password"} />{btn}</div>
    : <div className="pw-wrap"><input {...props} className={className} type={show ? "text" : "password"} />{btn}</div>;
}

/** Reads an image file, shrinks it and returns a data URL so admins can upload instead of pasting links. */
export function fileToDataUrl(file, maxSide = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("This file is not a valid image."));
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** Image URL input + upload button + preview (used in admin forms). */
export function ImageField({ label, value, onChange, maxSide = 900, round = false }) {
  const { t, toast } = useApp();
  const ref = useRef(null);
  const pick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    try { onChange(await fileToDataUrl(f, maxSide)); } catch (err) { toast(err.message, "error"); }
  };
  const isData = String(value || "").startsWith("data:");
  return (
    <div className="field image-field">
      <span>{label}</span>
      <div className="image-field-row">
        <div className={`image-preview ${round ? "round" : ""}`}>{value ? <img src={value} alt="" onError={(e) => { e.currentTarget.style.opacity = 0; }} /> : <GraduationCap size={22} />}</div>
        <div className="image-field-inputs">
          <input className="input" value={isData ? "" : value || ""} placeholder={isData ? t("Uploaded image") : "https://..."} onChange={(e) => onChange(e.target.value)} />
          <div className="row-actions">
            <button type="button" className="btn outline sm" onClick={() => ref.current?.click()}><Upload size={14} /> {t("Upload image")}</button>
            {value && <button type="button" className="btn outline sm" onClick={() => onChange("")}>{t("Remove")}</button>}
          </div>
          <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
        </div>
      </div>
    </div>
  );
}

/** Fades / slides children in the first time they scroll into view. */
export function Reveal({ children, as: Tag = "div", delay = 0, className = "", ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`reveal ${seen ? "in" : ""} ${className}`} style={{ "--d": `${delay}ms` }} {...rest}>{children}</Tag>;
}

/** Counts up to a value like "50K+" or "4.8" once it scrolls into view. */
export function CountUp({ value, duration = 1200 }) {
  const m = String(value).match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!m) return;
    const target = parseFloat(m[2]);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof IntersectionObserver === "undefined") { setN(target); return; }
    let raf, started = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return;
      started = true; io.disconnect();
      const t0 = performance.now();
      const tick = (now) => { const p = Math.min(1, (now - t0) / duration); setN(target * (1 - Math.pow(1 - p, 3))); if (p < 1) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]); // eslint-disable-line
  if (!m) return <span>{value}</span>;
  const dec = (m[2].split(".")[1] || "").length;
  return <span ref={ref}>{m[1]}{n.toFixed(dec)}{m[3]}</span>;
}
