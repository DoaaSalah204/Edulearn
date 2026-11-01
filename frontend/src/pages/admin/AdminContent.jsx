import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../api";
import { useApp } from "../../context/AppContext";
import { ImageField } from "../../components/ui";
import { ICON_KEYS } from "../../siteDefaults";

const TABS = [["home", "Home Page"], ["categories", "Categories"], ["faq", "FAQ"], ["about", "About & Contact"]];

/** Lets the admin edit the text and images shown on the public website. */
export default function AdminContent() {
  const { t, toast, content, reloadSite } = useApp();
  const [tab, setTab] = useState("home");
  const [c, setC] = useState(() => JSON.parse(JSON.stringify(content)));
  const [busy, setBusy] = useState(false);
  const up = (key, patch) => setC({ ...c, [key]: { ...c[key], ...patch } });
  const setList = (key, i, patch) => setC({ ...c, [key]: c[key].map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const delItem = (key, i) => setC({ ...c, [key]: c[key].filter((_, k) => k !== i) });

  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api("/admin/settings", { method: "PATCH", body: { content: c } }); await reloadSite(); toast(t("Website content saved.")); }
    catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };
  const reset = async () => {
    if (!window.confirm(t("Reset all website content to the original defaults?"))) return;
    try { await api("/admin/settings", { method: "PATCH", body: { resetContent: true } }); await reloadSite(); toast(t("Content reset.")); setTimeout(() => window.location.reload(), 400); }
    catch (err) { toast(err.message, "error"); }
  };

  return (
    <>
      <div className="page-title"><div><h1>{t("Website Content")}</h1><p className="muted">{t("Edit the texts, images, categories and questions shown on the website.")}</p></div></div>
      <div className="tabs" role="tablist">{TABS.map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(label)}</button>)}</div>
      <form className="stack" onSubmit={save}>
        {tab === "home" && (
          <>
            <div className="card pad stack">
              <h4>{t("Hero section")}</h4>
              <label className="field"><span>{t("Small label above the title")}</span><input className="input" value={c.hero.eyebrow} onChange={(e) => up("hero", { eyebrow: e.target.value })} /></label>
              <div className="grid-2">
                <label className="field"><span>{t("Title")}</span><input className="input" value={c.hero.title} onChange={(e) => up("hero", { title: e.target.value })} /></label>
                <label className="field"><span>{t("Highlighted title")}</span><input className="input" value={c.hero.highlight} onChange={(e) => up("hero", { highlight: e.target.value })} /></label>
              </div>
              <label className="field"><span>{t("Description")}</span><textarea className="textarea" value={c.hero.text} onChange={(e) => up("hero", { text: e.target.value })} /></label>
              <ImageField label={t("Hero image")} value={c.hero.image} onChange={(v) => up("hero", { image: v })} maxSide={1000} />
            </div>
            <div className="card pad stack">
              <div className="card-head"><h4>{t("Numbers bar")}</h4><button type="button" className="btn outline sm" disabled={c.stats.length >= 6} onClick={() => setC({ ...c, stats: [...c.stats, { value: "0", label: "" }] })}><Plus size={14} /> {t("Add")}</button></div>
              {c.stats.map((s, i) => (
                <div key={i} className="editor-row"><input className="input short" value={s.value} onChange={(e) => setList("stats", i, { value: e.target.value })} aria-label={t("Value")} /><input className="input" value={s.label} onChange={(e) => setList("stats", i, { label: e.target.value })} aria-label={t("Label")} /><button type="button" className="icon-btn danger" onClick={() => delItem("stats", i)} aria-label={t("Delete")}><Trash2 size={15} /></button></div>
              ))}
            </div>
          </>
        )}
        {tab === "categories" && (
          <div className="card pad stack">
            <div className="card-head"><h4>{t("Course categories")}</h4><button type="button" className="btn outline sm" disabled={c.categories.length >= 12} onClick={() => setC({ ...c, categories: [...c.categories, { name: "", icon: "book" }] })}><Plus size={14} /> {t("Add category")}</button></div>
            <p className="muted small">{t("These appear on the home page, the course filters and the course form. Courses keep the category name they were saved with.")}</p>
            {c.categories.map((x, i) => (
              <div key={i} className="editor-row"><input className="input" value={x.name} onChange={(e) => setList("categories", i, { name: e.target.value })} placeholder={t("Category name")} />
                <select className="select short" value={x.icon} onChange={(e) => setList("categories", i, { icon: e.target.value })} aria-label={t("Icon")}>{ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
                <button type="button" className="icon-btn danger" onClick={() => delItem("categories", i)} aria-label={t("Delete")}><Trash2 size={15} /></button></div>
            ))}
          </div>
        )}
        {tab === "faq" && (
          <div className="card pad stack">
            <div className="card-head"><h4>{t("Frequently asked questions")}</h4><button type="button" className="btn outline sm" onClick={() => setC({ ...c, faqs: [...c.faqs, { topic: "General Questions", q: "", a: "" }] })}><Plus size={14} /> {t("Add question")}</button></div>
            {c.faqs.map((f, i) => (
              <div key={i} className="editor-section">
                <div className="editor-row"><select className="select" value={f.topic} onChange={(e) => setList("faqs", i, { topic: e.target.value })}>{["Account & Profile", "Courses & Learning", "Payments & Refunds", "Certificates", "Technical Support", "General Questions"].map((x) => <option key={x} value={x}>{t(x)}</option>)}</select>
                  <button type="button" className="icon-btn danger" onClick={() => delItem("faqs", i)} aria-label={t("Delete")}><Trash2 size={15} /></button></div>
                <input className="input" placeholder={t("Question")} value={f.q} onChange={(e) => setList("faqs", i, { q: e.target.value })} />
                <textarea className="textarea" placeholder={t("Answer")} value={f.a} onChange={(e) => setList("faqs", i, { a: e.target.value })} />
              </div>
            ))}
          </div>
        )}
        {tab === "about" && (
          <>
            <div className="card pad stack">
              <h4>{t("About page")}</h4>
              <label className="field"><span>{t("Title")}</span><input className="input" value={c.about.title} onChange={(e) => up("about", { title: e.target.value })} /></label>
              <label className="field"><span>{t("Text")}</span><textarea className="textarea" value={c.about.text} onChange={(e) => up("about", { text: e.target.value })} /></label>
              <ImageField label={t("Image")} value={c.about.image} onChange={(v) => up("about", { image: v })} maxSide={1000} />
            </div>
            <div className="card pad stack">
              <h4>{t("Contact details")}</h4>
              <div className="grid-3">
                <label className="field"><span>{t("Email")}</span><input className="input" type="email" value={c.contact.email} onChange={(e) => up("contact", { email: e.target.value })} /></label>
                <label className="field"><span>{t("Phone")}</span><input className="input" value={c.contact.phone} onChange={(e) => up("contact", { phone: e.target.value })} /></label>
                <label className="field"><span>{t("Address")}</span><input className="input" value={c.contact.address} onChange={(e) => up("contact", { address: e.target.value })} /></label>
              </div>
            </div>
            <div className="card pad stack">
              <h4>{t("Footer & social links")}</h4>
              <label className="field"><span>{t("Footer text")}</span><textarea className="textarea" value={c.footerText} onChange={(e) => setC({ ...c, footerText: e.target.value })} /></label>
              <div className="grid-2">
                {["facebook", "twitter", "linkedin", "youtube"].map((k) => <label key={k} className="field"><span>{k[0].toUpperCase() + k.slice(1)} URL</span><input className="input" placeholder="https://..." value={c.social[k]} onChange={(e) => up("social", { [k]: e.target.value })} /></label>)}
              </div>
              <p className="muted small">{t("Icons only show in the footer for links you fill in.")}</p>
            </div>
          </>
        )}
        <div className="row-actions"><button className="btn primary" disabled={busy}>{t("Save Changes")}</button><button type="button" className="btn outline" onClick={reset}>{t("Reset to defaults")}</button></div>
      </form>
    </>
  );
}
