import { useState } from "react";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { api, money } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { Empty, ErrorBox, ImageField, Modal, Spinner, Thumb } from "../../components/ui";

const blank = (instructorId = "") => ({ title: "", description: "", category: "Programming", level: "Beginner", price: 0, oldPrice: 0, instructorId, duration: "", language: "English", thumbnail: "", published: true, learnText: "", sections: [{ title: "Section 1: Introduction", lessons: [{ title: "", duration: "", videoUrl: "" }] }] });

export default function AdminCourses() {
  const { t, toast, content } = useApp();
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null);
  const CATS = [...new Set([...content.categories.map((c) => c.name), ...(form?.category ? [form.category] : [])])];
  const [busy, setBusy] = useState(false);
  const courses = useFetch(() => api("/courses", { query: { includeUnpublished: "true" } }), []);
  const instructors = useFetch(() => api("/instructors"), []);

  const edit = async (c) => {
    try { const d = await api(`/courses/${c.id}`); const x = d.course; setForm({ ...x, instructorId: x.instructorId, learnText: x.learn.join("\n") }); }
    catch (e) { toast(e.message, "error"); }
  };
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    const body = { ...form, price: Number(form.price) || 0, oldPrice: Number(form.oldPrice) || 0, learn: form.learnText.split("\n").map((x) => x.trim()).filter(Boolean) };
    delete body.learnText;
    try {
      await api(form.id ? `/courses/${form.id}` : "/courses", { method: form.id ? "PUT" : "POST", body });
      toast(t("Course saved.")); setForm(null); courses.reload();
    } catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };
  const remove = async (c) => {
    if (!window.confirm(t("Delete this course? Enrollments and progress will be removed too."))) return;
    try { await api(`/courses/${c.id}`, { method: "DELETE" }); toast(t("Course deleted.")); courses.reload(); } catch (e) { toast(e.message, "error"); }
  };
  const setSection = (si, patch) => setForm({ ...form, sections: form.sections.map((s, i) => (i === si ? { ...s, ...patch } : s)) });
  const setLesson = (si, li, patch) => setSection(si, { lessons: form.sections[si].lessons.map((l, i) => (i === li ? { ...l, ...patch } : l)) });

  if (courses.loading || instructors.loading) return <Spinner />;
  if (courses.error) return <ErrorBox message={courses.error} onRetry={courses.reload} />;
  const list = courses.data.courses.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="page-title"><div><h1>{t("Courses")}</h1><p className="muted">{courses.data.total} {t("courses")}</p></div>
        <button className="btn primary" onClick={() => setForm(blank(instructors.data.instructors[0]?.id))}><Plus size={16} /> {t("Add Course")}</button></div>
      <label className="search-field wide"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search courses...")} /></label>
      {list.length === 0 ? <Empty title={t("No courses found")} /> : (
        <div className="card table-wrap"><table className="data">
          <thead><tr><th>{t("Course")}</th><th>{t("Category")}</th><th>{t("Instructor")}</th><th>{t("Price")}</th><th>{t("Students")}</th><th>{t("Status")}</th><th /></tr></thead>
          <tbody>{list.map((c) => (
            <tr key={c.id}>
              <td><div className="cell-user"><div className="sum-thumb"><Thumb src={c.thumbnail} alt="" /></div><b className="clip">{c.title}</b></div></td>
              <td>{t(c.category)}</td><td>{c.instructor?.name}</td><td>{money(c.price)}</td><td>{c.students}</td>
              <td><span className={`badge ${c.published ? "green" : "gray"}`}>{c.published ? t("Published") : t("Draft")}</span></td>
              <td><div className="row-actions"><button className="icon-btn" onClick={() => edit(c)} aria-label={t("Edit")}><Pencil size={15} /></button><button className="icon-btn danger" onClick={() => remove(c)} aria-label={t("Delete")}><Trash2 size={15} /></button></div></td>
            </tr>))}</tbody></table></div>
      )}
      {form && (
        <Modal title={form.id ? t("Edit Course") : t("Add Course")} onClose={() => setForm(null)} wide>
          <form onSubmit={save} className="stack">
            <label className="field"><span>{t("Title")}</span><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label className="field"><span>{t("Description")}</span><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <div className="grid-3">
              <label className="field"><span>{t("Category")}</span><select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATS.map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
              <label className="field"><span>{t("Level")}</span><select className="select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>{["Beginner", "Intermediate", "Advanced"].map((c) => <option key={c} value={c}>{t(c)}</option>)}</select></label>
              <label className="field"><span>{t("Instructor")}</span><select className="select" value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })}>{instructors.data.instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
              <label className="field"><span>{t("Price")} ($)</span><input className="input" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
              <label className="field"><span>{t("Original price")} ($)</span><input className="input" type="number" min="0" step="0.01" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} /></label>
              <label className="field"><span>{t("Duration")}</span><input className="input" placeholder="12 hours" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></label>
            </div>
            <ImageField label={t("Course image")} value={form.thumbnail} onChange={(v) => setForm({ ...form, thumbnail: v })} />
            <label className="field"><span>{t("What students will learn (one per line)")}</span><textarea className="textarea" value={form.learnText} onChange={(e) => setForm({ ...form, learnText: e.target.value })} /></label>
            <div className="editor">
              <div className="card-head"><h4>{t("Curriculum")}</h4><button type="button" className="btn outline sm" onClick={() => setForm({ ...form, sections: [...form.sections, { title: `Section ${form.sections.length + 1}`, lessons: [{ title: "", duration: "", videoUrl: "" }] }] })}><Plus size={14} /> {t("Add section")}</button></div>
              {form.sections.map((s, si) => (
                <div key={si} className="editor-section">
                  <div className="editor-row"><input className="input" value={s.title} onChange={(e) => setSection(si, { title: e.target.value })} aria-label={t("Section title")} /><button type="button" className="icon-btn danger" onClick={() => setForm({ ...form, sections: form.sections.filter((_, i) => i !== si) })} aria-label={t("Delete")}><X size={15} /></button></div>
                  {s.lessons.map((l, li) => (
                    <div key={li} className="editor-row lesson">
                      <input className="input" placeholder={t("Lesson title")} value={l.title} onChange={(e) => setLesson(si, li, { title: e.target.value })} />
                      <input className="input short" placeholder="5:30" value={l.duration} onChange={(e) => setLesson(si, li, { duration: e.target.value })} />
                      <input className="input" placeholder={t("Video URL (.mp4)")} value={l.videoUrl || ""} onChange={(e) => setLesson(si, li, { videoUrl: e.target.value })} />
                      <button type="button" className="icon-btn" onClick={() => setSection(si, { lessons: s.lessons.filter((_, i) => i !== li) })} aria-label={t("Delete")}><X size={15} /></button>
                    </div>
                  ))}
                  <button type="button" className="link small" onClick={() => setSection(si, { lessons: [...s.lessons, { title: "", duration: "", videoUrl: "" }] })}>+ {t("Add lesson")}</button>
                </div>
              ))}
            </div>
            <label className="check"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> {t("Published")}</label>
            <div className="modal-actions"><button type="button" className="btn outline" onClick={() => setForm(null)}>{t("Cancel")}</button><button className="btn primary" disabled={busy}>{t("Save")}</button></div>
          </form>
        </Modal>
      )}
    </>
  );
}
