import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, BookOpen, CreditCard, Award, Wrench, MessageCircle, ChevronDown } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Empty } from "../components/ui";

const TOPICS = [["Account & Profile", User], ["Courses & Learning", BookOpen], ["Payments & Refunds", CreditCard], ["Certificates", Award], ["Technical Support", Wrench], ["General Questions", MessageCircle]];
export default function Help() {
  const { t, toast, content } = useApp();
  const { user } = useAuth();
  const FAQ = content.faqs.map((f) => [f.topic, f.q, f.a]);
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");
  const [open, setOpen] = useState(0);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const list = FAQ.filter(([tp, a, b]) => (!topic || tp === topic) && (!q || `${a} ${b}`.toLowerCase().includes(q.toLowerCase()) || t(a).toLowerCase().includes(q.toLowerCase())));
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api("/support", { method: "POST", body: form }); setForm({ subject: "", message: "" }); toast(t("Your message was sent. We'll get back to you soon.")); }
    catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };

  return (
    <div className="container page">
      <section className="help-hero">
        <h1>{t("How can we help you?")}</h1>
        <label className="search-field big"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search for help...")} aria-label={t("Search for help...")} /></label>
      </section>
      <div className="topic-grid">
        {TOPICS.map(([name, I]) => (
          <button key={name} className={`topic card ${topic === name ? "on" : ""}`} onClick={() => setTopic(topic === name ? "" : name)}><span className="cat-icon violet"><I size={22} /></span><b>{t(name)}</b></button>
        ))}
      </div>
      <h2 className="mt">{t("Frequently Asked Questions")}</h2>
      {list.length === 0 ? <Empty title={t("No matching questions")} /> : (
        <div className="faq">
          {list.map(([, a, b], i) => (
            <div key={a} className={`faq-item card ${open === i ? "open" : ""}`}>
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>{t(a)}</span><ChevronDown size={18} /></button>
              {open === i && <p className="muted">{t(b)}</p>}
            </div>
          ))}
        </div>
      )}
      <section className="card pad contact-box">
        <h2>{t("Still need help?")}</h2>
        {user ? (
          <form onSubmit={send} className="stack">
            <label className="field"><span>{t("Subject")}</span><input className="input" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
            <label className="field"><span>{t("Message")}</span><textarea className="textarea" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></label>
            <div><button className="btn primary" disabled={busy}>{t("Send Message")}</button></div>
          </form>
        ) : <p className="muted">{t("Sign in to open a support ticket, or")} <Link className="link" to="/contact">{t("contact us")}</Link>.</p>}
      </section>
    </div>
  );
}
