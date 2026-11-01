import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { api } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { ErrorBox, Spinner } from "../../components/ui";

const newQuestion = () => ({ question: "", options: ["", "", "", ""], correctIndex: 0 });
const blankQuiz = (courseId) => ({ courseId, title: "Lesson Quiz", durationMinutes: 15, passingScore: 70, questions: [newQuestion()] });

export default function AdminQuizzes() {
  const { t, toast } = useApp();
  const courses = useFetch(() => api("/courses", { query: { includeUnpublished: "true" } }), []);
  const [courseId, setCourseId] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  useEffect(() => { if (!courseId && courses.data?.courses.length) setCourseId(courses.data.courses[0].id); }, [courses.data, courseId]);
  useEffect(() => {
    if (!courseId) return;
    setLoadingQuiz(true);
    api(`/admin/courses/${courseId}/quiz`).then((d) => setQuiz(d.quiz ? { ...d.quiz } : blankQuiz(courseId))).catch((e) => toast(e.message, "error")).finally(() => setLoadingQuiz(false));
  }, [courseId]); // eslint-disable-line

  if (courses.loading) return <Spinner />;
  if (courses.error) return <ErrorBox message={courses.error} onRetry={courses.reload} />;

  const setQ = (i, patch) => setQuiz({ ...quiz, questions: quiz.questions.map((q, k) => (k === i ? { ...q, ...patch } : q)) });
  const setOpt = (i, o, v) => setQ(i, { options: quiz.questions[i].options.map((x, k) => (k === o ? v : x)) });
  const save = async (e) => {
    e.preventDefault();
    for (const [i, q] of quiz.questions.entries()) {
      if (!q.question.trim()) return toast(`${t("Question")} ${i + 1}: ${t("write the question text")}`, "error");
      if (q.options.filter((o) => o.trim()).length < 2) return toast(`${t("Question")} ${i + 1}: ${t("add at least two answers")}`, "error");
      if (!q.options[q.correctIndex]?.trim()) return toast(`${t("Question")} ${i + 1}: ${t("the correct answer cannot be empty")}`, "error");
    }
    setBusy(true);
    try {
      const d = await api("/quizzes", { method: "POST", body: quiz });
      setQuiz(d.quiz); toast(t("Quiz saved."));
    } catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!quiz.id || !window.confirm(t("Delete this quiz?"))) return;
    try { await api(`/quizzes/${quiz.id}`, { method: "DELETE" }); setQuiz(blankQuiz(courseId)); toast(t("Quiz deleted.")); } catch (e) { toast(e.message, "error"); }
  };

  return (
    <>
      <div className="page-title"><div><h1>{t("Quizzes")}</h1><p className="muted">{t("One quiz per course. Students must pass it to get the certificate.")}</p></div></div>
      <label className="field narrow"><span>{t("Course")}</span>
        <select className="select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>{courses.data.courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      {loadingQuiz || !quiz ? <Spinner /> : (
        <form className="stack" onSubmit={save}>
          <div className="card pad grid-3">
            <label className="field"><span>{t("Quiz title")}</span><input className="input" required value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} /></label>
            <label className="field"><span>{t("Time (minutes)")}</span><input className="input" type="number" min="1" value={quiz.durationMinutes} onChange={(e) => setQuiz({ ...quiz, durationMinutes: e.target.value })} /></label>
            <label className="field"><span>{t("Passing score")} (%)</span><input className="input" type="number" min="1" max="100" value={quiz.passingScore} onChange={(e) => setQuiz({ ...quiz, passingScore: e.target.value })} /></label>
          </div>
          {quiz.questions.map((q, i) => (
            <div key={i} className="card pad stack">
              <div className="card-head"><h4>{t("Question")} {i + 1}</h4><button type="button" className="icon-btn danger" onClick={() => setQuiz({ ...quiz, questions: quiz.questions.filter((_, k) => k !== i) })} aria-label={t("Delete")}><Trash2 size={15} /></button></div>
              <input className="input" placeholder={t("Question text")} value={q.question} onChange={(e) => setQ(i, { question: e.target.value })} />
              {q.options.map((o, k) => (
                <div key={k} className="editor-row">
                  <label className="check" title={t("Correct answer")}><input type="radio" name={`correct-${i}`} checked={q.correctIndex === k} onChange={() => setQ(i, { correctIndex: k })} /></label>
                  <input className="input" placeholder={`${t("Answer")} ${k + 1}`} value={o} onChange={(e) => setOpt(i, k, e.target.value)} />
                  {q.options.length > 2 && <button type="button" className="icon-btn" onClick={() => setQ(i, { options: q.options.filter((_, n) => n !== k), correctIndex: q.correctIndex >= k && q.correctIndex > 0 ? q.correctIndex - 1 : q.correctIndex })} aria-label={t("Delete")}><X size={15} /></button>}
                </div>
              ))}
              <div className="row-actions"><button type="button" className="link small" disabled={q.options.length >= 8} onClick={() => setQ(i, { options: [...q.options, ""] })}>+ {t("Add answer")}</button><small className="muted">{t("Select the circle next to the correct answer.")}</small></div>
            </div>
          ))}
          <div className="row-actions">
            <button type="button" className="btn outline" onClick={() => setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion()] })}><Plus size={15} /> {t("Add question")}</button>
            <button className="btn primary" disabled={busy}>{t("Save Quiz")}</button>
            {quiz.id && <button type="button" className="btn outline danger-text" onClick={remove}>{t("Delete quiz")}</button>}
          </div>
        </form>
      )}
    </>
  );
}
