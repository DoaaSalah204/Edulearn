import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { PageTitle } from "../components/ui";

export default function Contact() {
  const { t, toast, content } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const send = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api("/contact", { method: "POST", body: form }); setForm({ ...form, subject: "", message: "" }); toast(t("Thanks! Your message was sent to EduLearn.")); }
    catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };
  return (
    <div className="container page">
      <PageTitle title={t("Get in touch")} sub={t("Questions, ideas, or feedback? We'd love to hear from you.")} />
      <div className="grid-2-1 reverse">
        <form className="card pad stack" onSubmit={send}>
          <div className="grid-2">
            <label className="field"><span>{t("Full Name")}</span><input className="input" required value={form.name} onChange={set("name")} /></label>
            <label className="field"><span>{t("Email Address")}</span><input className="input" type="email" required value={form.email} onChange={set("email")} /></label>
          </div>
          <label className="field"><span>{t("Subject")}</span><input className="input" value={form.subject} onChange={set("subject")} /></label>
          <label className="field"><span>{t("Message")}</span><textarea className="textarea" required value={form.message} onChange={set("message")} /></label>
          <div><button className="btn primary" disabled={busy}>{t("Send Message")}</button></div>
        </form>
        <div className="stack">
          <div className="card pad"><span className="cat-icon violet"><Mail size={22} /></span><h3>{t("Email us")}</h3><p className="muted">{content.contact.email}</p>{content.contact.phone && <p className="muted">{content.contact.phone}</p>}{content.contact.address && <p className="muted">{content.contact.address}</p>}</div>
          <div className="card pad"><span className="cat-icon violet"><MessageCircle size={22} /></span><h3>{t("Help Center")}</h3><p className="muted">{t("Find quick answers to common questions.")}</p><Link to="/help" className="link">{t("Visit Help & Support")}</Link></div>
        </div>
      </div>
    </div>
  );
}
