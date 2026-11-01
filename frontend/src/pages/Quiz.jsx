import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Award } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks";
import { Breadcrumbs, Empty, ErrorBox, Spinner } from "../components/ui";

export default function Quiz() {
  const { courseId } = useParams();
  const { t, toast } = useApp();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => api(`/courses/${courseId}/quiz`), [courseId]);
  const [answers, setAnswers] = useState({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const submitRef = useRef();

  const quiz = data?.quiz;
  useEffect(() => { if (quiz && left === null && !result) setLeft(quiz.durationMinutes * 60); }, [quiz]); // eslint-disable-line
  useEffect(() => {
    if (left === null || result) return;
    if (left <= 0) { submitRef.current && submitRef.current(); return; }
    const id = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(id);
  }, [left, result]);

  const submit = async () => {
    if (busy || result) return;
    setBusy(true);
    try {
      const r = await api(`/quizzes/${quiz.id}/submit`, { method: "POST", body: { answers } });
      setResult(r);
      if (r.certificate) toast(t("🎉 Certificate earned! Find it in My Certificates."));
    } catch (e) { toast(e.message, "error"); } finally { setBusy(false); }
  };
  submitRef.current = submit;

  if (loading) return <Spinner />;
  if (error) return <div className="container page"><ErrorBox message={error} onRetry={reload} /><div className="center"><Link className="btn primary" to={`/courses/${courseId}`}>{t("View course")}</Link></div></div>;

  const q = quiz.questions[i];
  const answered = Object.keys(answers).length;
  const mm = left !== null ? `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}` : "--:--";

  if (result) {
    const { attempt } = result;
    return (
      <div className="container page narrow">
        <Breadcrumbs items={[{ label: t("My Learning"), to: "/my-learning" }, { label: quiz.title }]} />
        <section className="card pad result">
          <div className={`result-ring ${attempt.passed ? "pass" : "fail"}`}>{attempt.score}%</div>
          <h1>{attempt.passed ? t("Great job! You passed.") : t("Not quite there yet.")}</h1>
          <p className="muted">{t("You answered {a} of {b} correctly. Passing score is {p}%.", { a: attempt.correct, b: attempt.total, p: quiz.passingScore })}</p>
          {result.certificate && <p className="badge green"><Award size={14} /> {t("Certificate earned!")}</p>}
          <div className="result-actions">
            <button className="btn outline" onClick={() => { setResult(null); setAnswers({}); setI(0); setLeft(quiz.durationMinutes * 60); }}>{t("Retake quiz")}</button>
            <Link to={result.certificate ? "/certificates" : `/learn/${courseId}`} className="btn primary">{result.certificate ? t("View certificate") : t("Back to course")}</Link>
          </div>
          <div className="review-answers">
            {quiz.questions.map((qq, n) => {
              const r = result.results.find((x) => x.questionId === qq.id);
              const ok = r.selectedIndex === r.correctIndex;
              return (
                <div key={qq.id} className={`answer-row ${ok ? "ok" : "bad"}`}>
                  {ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  <div><b>{n + 1}. {qq.question}</b>
                    <small className="muted">{t("Your answer")}: {r.selectedIndex === null ? t("No answer") : qq.options[r.selectedIndex]}{!ok && ` · ${t("Correct")}: ${qq.options[r.correctIndex]}`}</small></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: t("My Learning"), to: "/my-learning" }, { label: t("Course"), to: `/learn/${courseId}` }, { label: quiz.title }]} />
      <div className="quiz-grid">
        <section className="card pad quiz-card">
          <div className="quiz-top"><h2>{quiz.title}</h2><span className="badge blue"><Clock size={13} /> {mm}</span></div>
          <div className="quiz-meta"><span>{t("Question {a} of {b}", { a: i + 1, b: quiz.questions.length })}</span><span>{Math.round(((i + 1) / quiz.questions.length) * 100)}%</span></div>
          <div className="progress"><span style={{ width: `${((i + 1) / quiz.questions.length) * 100}%` }} /></div>
          <h3 className="question">{q.question}</h3>
          <div className="options" role="radiogroup">
            {q.options.map((o, n) => (
              <label key={n} className={`option ${answers[q.id] === n ? "picked" : ""}`}>
                <input type="radio" name={q.id} checked={answers[q.id] === n} onChange={() => setAnswers({ ...answers, [q.id]: n })} />
                <span className="dot" /> <span>{o}</span>
              </label>
            ))}
          </div>
          <div className="quiz-nav">
            <button className="btn outline" disabled={i === 0} onClick={() => setI(i - 1)}>{t("Previous")}</button>
            {i < quiz.questions.length - 1
              ? <button className="btn primary" onClick={() => setI(i + 1)}>{t("Next")}</button>
              : <button className="btn primary" disabled={busy} onClick={() => (answered < quiz.questions.length && !window.confirm(t("You have unanswered questions. Submit anyway?"))) ? null : submit()}>{t("Submit quiz")}</button>}
          </div>
        </section>
        <aside className="quiz-side">
          <div className="card pad"><h4>{t("Quiz Info")}</h4>
            <ul className="info-list"><li><span className="muted">{t("Questions")}</span><b>{quiz.questions.length}</b></li><li><span className="muted">{t("Time")}</span><b>{quiz.durationMinutes} {t("minutes")}</b></li><li><span className="muted">{t("Passing Score")}</span><b>{quiz.passingScore}%</b></li>
              {data.bestScore !== null && <li><span className="muted">{t("Best score")}</span><b>{data.bestScore}%</b></li>}</ul></div>
          <div className="card pad"><h4>{t("Question Navigation")}</h4>
            <div className="qnav">{quiz.questions.map((qq, n) => <button key={qq.id} className={`${n === i ? "current" : ""} ${answers[qq.id] !== undefined ? "answered" : ""}`} onClick={() => setI(n)} aria-label={`${n + 1}`}>{n + 1}</button>)}</div></div>
        </aside>
      </div>
    </div>
  );
}
