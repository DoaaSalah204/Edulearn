import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Avatar, PasswordInput } from "../components/ui";

export default function Profile() {
  const { t, toast } = useApp();
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone || "", bio: user.bio || "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const save = async (body, okMsg) => {
    setBusy(true);
    try { const d = await api("/profile", { method: "PATCH", body }); setUser(d.user); toast(okMsg || t("Changes saved successfully.")); return true; }
    catch (e) { toast(e.message, "error"); return false; } finally { setBusy(false); }
  };
  const pick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_000_000) return toast(t("Please choose an image smaller than 1MB."), "error");
    const r = new FileReader();
    r.onload = async () => { setAvatar(r.result); await save({ avatar: r.result }, t("Profile photo updated.")); };
    r.readAsDataURL(file);
  };

  return (
    <>
      <div className="page-title"><div><h1>{t("Profile Settings")}</h1><p className="muted">{t("Manage your personal information and password.")}</p></div></div>
      <div className="tabs" role="tablist">
        {[["info", "Profile Information"], ["password", "Change Password"]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(l)}</button>)}
      </div>
      {tab === "info" ? (
        <form className="card pad profile-form" onSubmit={(e) => { e.preventDefault(); save(form); }}>
          <div className="photo-row">
            <Avatar src={avatar} name={form.name} size={92} />
            <div><button type="button" className="btn primary sm" onClick={() => fileRef.current.click()}><Camera size={15} /> {t("Change Photo")}</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick} /><p className="muted small">{t("PNG or JPG, max 1MB")}</p></div>
          </div>
          <div className="grid-2">
            <label className="field"><span>{t("Full Name")}</span><input className="input" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>{t("Email Address")}</span><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="field"><span>{t("Phone Number")}</span><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+20 100 000 0000" /></label>
          </div>
          <label className="field"><span>{t("Bio")}</span><textarea className="textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
          <div><button className="btn primary" disabled={busy}>{t("Save Changes")}</button></div>
        </form>
      ) : (
        <form className="card pad profile-form" onSubmit={async (e) => { e.preventDefault(); if (await save(pw, t("Password updated."))) setPw({ currentPassword: "", newPassword: "" }); }}>
          <label className="field"><span>{t("Current Password")}</span><PasswordInput required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></label>
          <label className="field"><span>{t("New Password")}</span><PasswordInput required minLength={8} autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder={t("At least 8 characters")} /></label>
          <div><button className="btn primary" disabled={busy}>{t("Update Password")}</button></div>
        </form>
      )}
    </>
  );
}
