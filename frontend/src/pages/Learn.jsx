import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, PlayCircle, Circle, ChevronRight, Moon, Sun, Languages, Award, FileQuestion, Download } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks";
import { Logo, Spinner, ErrorBox, ProgressBar, Empty } from "../components/ui";
import Reviews from "../components/Reviews";

export default function Learn() {
  const { courseId, lessonId } = useParams();
  const { t, toast, theme, toggleTheme, toggleLang, lang } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("about");
  const [question, setQuestion] = useState("");
  const videoRef = useRef(null);
  const { data, loading, error, reload, setData } = useFetch(() => api(`/courses/${courseId}/learn`), [courseId]);

  const lessons = useMemo(() => (data ? data.course.sections.flatMap((s, si) => s.lessons.map((l) => ({ ...l, section: s.title, si }))) : []), [data]);
  const done = new Set(data?.progress.completedLessonIds || []);
  const current = lessons.find((l) => l.id === lessonId) || lessons.find((l) => !done.has(l.id)) || lessons[0];
  const idx = lessons.findIndex((l) => l.id === current?.id);
  const next = lessons[idx + 1];

  useEffect(() => { if (data && !lessonId && current) navigate(`/learn/${courseId}/${current.id}`, { replace: true }); }, [data]); // eslint-disable-line
  useEffect(() => { setTab("about"); }, [lessonId]);

  if (loading) return <Spinner />;
  if (error) return (
    <div className="container page"><ErrorBox message={error} onRetry={reload} /><div className="center"><Link to={`/courses/${courseId}`} className="btn primary">{t("View course")}</Link></div></div>
  );
  if (!current) return <div className="container page"><Empty title={t("This course has no lessons yet")} /></div>;

  const markDone = async (goNext = true) => {
    try {
      const r = await api("/progress", { method: "POST", body: { courseId, lessonId: current.id } });
      setData({ ...data, progress: r.progress, certificate: r.certificate || data.certificate });
      if (r.certificate) toast(t("🎉 Certificate earned! Find it in My Certificates."));
      else if (r.progress.percent >= 100 && data.quiz) toast(t("All lessons done! Take the quiz to earn your certificate."));
      if (goNext && next) navigate(`/learn/${courseId}/${next.id}`);
    } catch (e) { toast(e.message, "error"); }
  };
  const ask = async (e) => {
    e.preventDefault();
    try { await api("/support", { method: "POST", body: { subject: `Question: ${data.course.title} — ${current.title}`, message: question } }); setQuestion(""); toast(t("Your question was sent to support.")); }
    catch (err) { toast(err.message, "error"); }
  };
  const pct = data.progress.percent;

  return (
    <div className="learn-page">
      <header className="learn-bar">
        <Link to="/my-learning" className="icon-btn" aria-label={t("My Learning")}><ArrowLeft size={18} /></Link>
        <Logo light />
        <div className="learn-bar-title"><b>{data.course.title}</b><div className="bar-progress"><ProgressBar value={pct} /><small>{pct}%</small></div></div>
        <button className="icon-btn" onClick={toggleLang}><Languages size={18} /><span className="lang-tag">{lang === "en" ? "AR" : "EN"}</span></button>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Theme">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
      </header>

      <div className="learn-grid">
        <section className="learn-main">
          <div className="player">
            {current.videoUrl ? <video key={current.id} ref={videoRef} src={current.videoUrl} controls autoPlay={false} onEnded={() => !done.has(current.id) && markDone(true)} /> : <div className="no-video">{t("No video for this lesson yet.")}</div>}
          </div>
          <div className="lesson-head">
            <div><h1>{current.title}</h1><p className="muted small">{current.section} · {current.duration}</p></div>
            <div className="lesson-actions">
              {!done.has(current.id) ? <button className="btn primary sm" onClick={() => markDone(true)}><CheckCircle2 size={15} /> {t("Mark as complete")}</button> : <span className="badge green"><CheckCircle2 size={13} /> {t("Completed")}</span>}
              {next && <button className="btn outline sm" onClick={() => navigate(`/learn/${courseId}/${next.id}`)}>{t("Next lesson")} <ChevronRight size={15} /></button>}
            </div>
          </div>

          <div className="tabs" role="tablist">
            {[["about", "About"], ["resources", "Resources"], ["qa", "Q&A"], ["discussion", "Discussion"]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(l)}</button>)}
          </div>
          <div className="learn-tab card pad">
            {tab === "about" && <><h3>{t("About this lesson")}</h3><p>{data.course.description}</p><Link to={`/courses/${courseId}`} className="link">{t("Course details")}</Link></>}
            {tab === "resources" && <Empty icon={Download} title={t("No downloadable resources yet")} text={t("Your instructor has not attached files to this lesson.")} />}
            {tab === "qa" && (
              <form onSubmit={ask} className="stack"><h3>{t("Ask a question")}</h3><textarea className="textarea" required value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t("Type your question about this lesson...")} /><div><button className="btn primary">{t("Send to support")}</button></div></form>
            )}
            {tab === "discussion" && <Reviews kind="course" targetId={courseId} />}
          </div>
        </section>

        <aside className="learn-side card">
          <h3>{t("Course Content")}</h3>
          {data.course.sections.map((s) => (
            <div key={s.id} className="learn-section">
              <div className="learn-section-title">{s.title}</div>
              {s.lessons.map((l) => (
                <button key={l.id} className={`learn-lesson ${l.id === current.id ? "current" : ""}`} onClick={() => navigate(`/learn/${courseId}/${l.id}`)}>
                  {done.has(l.id) ? <CheckCircle2 size={16} className="ok" /> : l.id === current.id ? <PlayCircle size={16} /> : <Circle size={16} />}
                  <span>{l.title}</span><small>{l.duration}</small>
                </button>
              ))}
            </div>
          ))}
          {data.quiz && <button className="btn primary block" onClick={() => navigate(`/quiz/${courseId}`)}><FileQuestion size={16} /> {t("Take the quiz")}</button>}
          {data.certificate && <Link to="/certificates" className="btn outline block"><Award size={16} /> {t("View certificate")}</Link>}
        </aside>
      </div>
    </div>
  );
}
