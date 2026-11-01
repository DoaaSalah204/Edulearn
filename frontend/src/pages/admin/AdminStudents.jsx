import { useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api, fmtDate } from "../../api";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useFetch, useDebounced } from "../../hooks";
import { Avatar, ErrorBox, Modal, PasswordInput, Spinner } from "../../components/ui";

const blank = { name: "", email: "", password: "", role: "student", phone: "" };

export default function AdminStudents() {
  const { t, toast, lang } = useApp();
  const { user: me } = useAuth();
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [form, setForm] = useState(null);       // add / edit modal
  const [enrolls, setEnrolls] = useState([]);   // enrollments of the user being edited
  const [pick, setPick] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useFetch(() => api("/admin/users", { query: { search: dq } }), [dq]);
  const courses = useFetch(() => api("/courses", { query: { includeUnpublished: "true" } }), []);

  const patch = async (u, body) => { try { await api(`/admin/users/${u.id}`, { method: "PATCH", body }); toast(t("User updated.")); reload(); } catch (e) { toast(e.message, "error"); } };
  const remove = async (u) => {
    if (!window.confirm(t("Delete this user permanently?"))) return;
    try { await api(`/admin/users/${u.id}`, { method: "DELETE" }); toast(t("User deleted.")); reload(); } catch (e) { toast(e.message, "error"); }
  };
  const loadEnrolls = (id) => api(`/admin/users/${id}/enrollments`).then((d) => setEnrolls(d.enrollments)).catch(() => setEnrolls([]));
  const open = (u) => { if (!u) { setForm(blank); setEnrolls([]); return; } setForm({ ...u, password: "" }); setPick(""); loadEnrolls(u.id); };
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      if (form.id) {
        const body = { name: form.name, email: form.email, phone: form.phone, role: form.role };
        if (form.password) body.password = form.password;
        await api(`/admin/users/${form.id}`, { method: "PATCH", body });
      } else await api("/admin/users", { method: "POST", body: form });
      toast(t("User saved.")); setForm(null); reload();
    } catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };
  const addEnroll = async () => {
    if (!pick) return;
    try { await api("/admin/enrollments", { method: "POST", body: { userId: form.id, courseId: pick } }); setPick(""); loadEnrolls(form.id); reload(); toast(t("Course added.")); } catch (e) { toast(e.message, "error"); }
  };
  const delEnroll = async (id) => {
    if (!window.confirm(t("Remove this course from the student? Their progress in it will be deleted."))) return;
    try { await api(`/admin/enrollments/${id}`, { method: "DELETE" }); loadEnrolls(form.id); reload(); } catch (e) { toast(e.message, "error"); }
  };

  const free = (courses.data?.courses || []).filter((c) => !enrolls.some((e) => e.courseId === c.id));
  return (
    <>
      <div className="page-title"><div><h1>{t("Students")}</h1><p className="muted">{data?.total ?? 0} {t("users")}</p></div>
        <button className="btn primary" onClick={() => open(null)}><Plus size={16} /> {t("Add Student")}</button></div>
      <label className="search-field wide"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search by name or email...")} /></label>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="card table-wrap"><table className="data">
          <thead><tr><th>{t("Name")}</th><th>{t("Email")}</th><th>{t("Role")}</th><th>{t("Courses")}</th><th>{t("Joined")}</th><th>{t("Status")}</th><th /></tr></thead>
          <tbody>{data.users.map((u) => (
            <tr key={u.id}><td><div className="cell-user"><Avatar src={u.avatar} name={u.name} size={30} />{u.name}</div></td><td>{u.email}</td>
              <td><select className="select compact" value={u.role} disabled={u.id === me.id} onChange={(e) => patch(u, { role: e.target.value })}><option value="student">{t("Student")}</option><option value="admin">{t("Admin")}</option></select></td>
              <td>{u.enrollmentsCount}</td><td>{fmtDate(u.createdAt, lang)}</td>
              <td><span className={`badge ${u.status === "active" ? "green" : "red"}`}>{t(u.status)}</span></td>
              <td><div className="row-actions">
                <button className="icon-btn" onClick={() => open(u)} aria-label={t("Edit")}><Pencil size={15} /></button>
                {u.id !== me.id && <><button className="btn outline sm" onClick={() => patch(u, { status: u.status === "active" ? "suspended" : "active" })}>{u.status === "active" ? t("Suspend") : t("Activate")}</button><button className="icon-btn danger" onClick={() => remove(u)} aria-label={t("Delete")}><Trash2 size={15} /></button></>}
              </div></td></tr>
          ))}</tbody></table></div>
      )}
      {form && (
        <Modal title={form.id ? t("Edit User") : t("Add Student")} onClose={() => setForm(null)} wide>
          <form onSubmit={save} className="stack">
            <div className="grid-2">
              <label className="field"><span>{t("Full Name")}</span><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="field"><span>{t("Email Address")}</span><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label className="field"><span>{t("Phone")}</span><input className="input" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label className="field"><span>{t("Role")}</span><select className="select" value={form.role} disabled={form.id === me.id} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="student">{t("Student")}</option><option value="admin">{t("Admin")}</option></select></label>
            </div>
            <label className="field"><span>{form.id ? t("New password (leave empty to keep the current one)") : t("Password")}</span>
              <PasswordInput required={!form.id} minLength={form.id ? undefined : 8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t("At least 8 characters")} /></label>
            {form.id && (
              <div className="editor">
                <div className="card-head"><h4>{t("Enrolled courses")}</h4></div>
                {enrolls.length === 0 && <p className="muted small">{t("Not enrolled in any course yet.")}</p>}
                {enrolls.map((e) => <div key={e.id} className="editor-row"><span className="grow">{e.title} <small className="muted">· {e.progress}%</small></span><button type="button" className="icon-btn danger" onClick={() => delEnroll(e.id)} aria-label={t("Delete")}><X size={15} /></button></div>)}
                <div className="editor-row"><select className="select" value={pick} onChange={(e) => setPick(e.target.value)}><option value="">{t("Choose a course to add...")}</option>{free.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select><button type="button" className="btn outline sm" disabled={!pick} onClick={addEnroll}>{t("Add course")}</button></div>
              </div>
            )}
            <div className="modal-actions"><button type="button" className="btn outline" onClick={() => setForm(null)}>{t("Cancel")}</button><button className="btn primary" disabled={busy}>{t("Save")}</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
