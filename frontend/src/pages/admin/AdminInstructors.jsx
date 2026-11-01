import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, compact } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { Avatar, ErrorBox, ImageField, Modal, Spinner } from "../../components/ui";

const blank = { name: "", title: "", avatar: "", bio: "", experience: 1, expertiseText: "" };

export default function AdminInstructors() {
  const { t, toast } = useApp();
  const [form, setForm] = useState(null);
  const { data, loading, error, reload } = useFetch(() => api("/instructors"), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const save = async (e) => {
    e.preventDefault();
    const body = { ...form, experience: Number(form.experience) || 0, expertise: form.expertiseText.split(",").map((x) => x.trim()).filter(Boolean) };
    delete body.expertiseText;
    try { await api(form.id ? `/instructors/${form.id}` : "/instructors", { method: form.id ? "PUT" : "POST", body }); toast(t("Instructor saved.")); setForm(null); reload(); }
    catch (err) { toast(err.message, "error"); }
  };
  const remove = async (i) => {
    if (!window.confirm(t("Delete this instructor?"))) return;
    try { await api(`/instructors/${i.id}`, { method: "DELETE" }); toast(t("Instructor deleted.")); reload(); } catch (err) { toast(err.message, "error"); }
  };
  return (
    <>
      <div className="page-title"><div><h1>{t("Instructors")}</h1><p className="muted">{data.total} {t("instructors")}</p></div><button className="btn primary" onClick={() => setForm(blank)}><Plus size={16} /> {t("Add Instructor")}</button></div>
      <div className="card table-wrap"><table className="data">
        <thead><tr><th>{t("Instructor")}</th><th>{t("Title")}</th><th>{t("Courses")}</th><th>{t("Students")}</th><th>{t("Rating")}</th><th /></tr></thead>
        <tbody>{data.instructors.map((i) => (
          <tr key={i.id}><td><div className="cell-user"><Avatar src={i.avatar} name={i.name} size={34} /><b>{i.name}</b></div></td><td>{i.title}</td><td>{i.coursesCount}</td><td>{compact(i.students)}</td><td>{i.rating || "—"}</td>
            <td><div className="row-actions"><button className="icon-btn" onClick={() => setForm({ ...i, expertiseText: i.expertise.join(", ") })} aria-label={t("Edit")}><Pencil size={15} /></button><button className="icon-btn danger" onClick={() => remove(i)} aria-label={t("Delete")}><Trash2 size={15} /></button></div></td></tr>
        ))}</tbody></table></div>
      {form && (
        <Modal title={form.id ? t("Edit Instructor") : t("Add Instructor")} onClose={() => setForm(null)}>
          <form onSubmit={save} className="stack">
            <label className="field"><span>{t("Full Name")}</span><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field"><span>{t("Title")}</span><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <ImageField label={t("Photo")} value={form.avatar} onChange={(v) => setForm({ ...form, avatar: v })} maxSide={400} round />
            <label className="field"><span>{t("Years Experience")}</span><input className="input" type="number" min="0" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></label>
            <label className="field"><span>{t("Expertise (comma separated)")}</span><input className="input" value={form.expertiseText} onChange={(e) => setForm({ ...form, expertiseText: e.target.value })} /></label>
            <label className="field"><span>{t("Bio")}</span><textarea className="textarea" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
            <div className="modal-actions"><button type="button" className="btn outline" onClick={() => setForm(null)}>{t("Cancel")}</button><button className="btn primary">{t("Save")}</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
