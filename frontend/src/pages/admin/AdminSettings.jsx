import { useState } from "react";
import { api } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { ErrorBox, Spinner } from "../../components/ui";

export default function AdminSettings() {
  const { t, toast } = useApp();
  const { data, loading, error, reload } = useFetch(() => api("/settings"), []);
  const [form, setForm] = useState(null);
  const f = form || data?.settings;
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const save = async (e) => { e.preventDefault(); try { await api("/admin/settings", { method: "PATCH", body: f }); toast(t("Settings saved.")); } catch (err) { toast(err.message, "error"); } };
  return (
    <>
      <div className="page-title"><div><h1>{t("Settings")}</h1><p className="muted">{t("Platform settings")}</p></div></div>
      <form className="card pad profile-form" onSubmit={save}>
        <label className="field"><span>{t("Platform name")}</span><input className="input" value={f.platformName} onChange={(e) => setForm({ ...f, platformName: e.target.value })} /></label>
        <label className="field"><span>{t("Currency")}</span><input className="input" maxLength={4} value={f.currency} onChange={(e) => setForm({ ...f, currency: e.target.value })} /></label>
        <label className="field"><span>{t("Support email")}</span><input className="input" type="email" value={f.supportEmail || ""} onChange={(e) => setForm({ ...f, supportEmail: e.target.value })} /></label>
        <label className="check"><input type="checkbox" checked={f.allowRegistration} onChange={(e) => setForm({ ...f, allowRegistration: e.target.checked })} /> {t("Allow new students to register")}</label>
        <div><button className="btn primary">{t("Save Changes")}</button></div>
      </form>
    </>
  );
}
