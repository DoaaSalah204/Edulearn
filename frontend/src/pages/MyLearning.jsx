import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlayCircle, BookOpen, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks";
import { Empty, ErrorBox, ProgressBar, Spinner, Thumb } from "../components/ui";

export default function MyLearning() {
  const { t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("progress");
  const { data, loading, error, reload } = useFetch(() => api("/enrollments"), []);
  const saved = useFetch(() => api("/wishlist"), []);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const all = data.enrollments;
  const inProgress = all.filter((e) => e.progress.percent < 100);
  const done = all.filter((e) => e.progress.percent >= 100);
  const overall = all.length ? Math.round(all.reduce((s, e) => s + e.progress.percent, 0) / all.length) : 0;
  const list = tab === "progress" ? inProgress : tab === "completed" ? done : saved.data?.items.map((w) => ({ id: w.id, course: w.course, progress: null })) || [];

  return (
    <>
      <div className="page-title"><div><h1>{t("My Learning")}</h1><p className="muted">{t("Welcome back, {name}!", { name: user.name.split(" ")[0] })}</p></div></div>
      <div className="learning-grid">
        <div>
          <div className="tabs" role="tablist">
            {[["progress", `${t("In Progress")} (${inProgress.length})`], ["completed", `${t("Completed")} (${done.length})`], ["saved", `${t("Saved")} (${saved.data?.items.length ?? 0})`]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          {list.length === 0 ? (
            <Empty icon={BookOpen} title={all.length === 0 && tab !== "saved" ? t("You haven't enrolled in any course yet") : t("Nothing here yet")} text={t("Browse our catalog and start learning today.")} action={<Link to="/courses" className="btn primary">{t("Browse Courses")}</Link>} />
          ) : (
            <div className="learn-cards">
              {list.map((e) => (
                <article key={e.id} className="learn-card card">
                  <Link to={e.progress ? `/learn/${e.course.id}` : `/courses/${e.course.id}`} className="learn-thumb"><Thumb src={e.course.thumbnail} alt="" /></Link>
                  <div className="learn-info">
                    <h3><Link to={`/courses/${e.course.id}`}>{e.course.title}</Link></h3>
                    <p className="muted small">{e.course.instructor?.name} · {e.course.duration}</p>
                    {e.progress && <><ProgressBar value={e.progress.percent} /><small className="muted">{e.progress.percent}% {t("completed")} ({e.progress.completed}/{e.progress.total})</small></>}
                  </div>
                  {e.progress
                    ? <button className="btn primary sm" onClick={() => navigate(`/learn/${e.course.id}`)}>{e.progress.percent >= 100 ? <><CheckCircle2 size={15} /> {t("Review")}</> : <><PlayCircle size={15} /> {t("Continue")}</>}</button>
                    : <button className="btn outline sm" onClick={() => navigate(`/courses/${e.course.id}`)}>{t("View course")}</button>}
                </article>
              ))}
            </div>
          )}
        </div>
        <aside className="card pad progress-card">
          <h3>{t("Learning Progress")}</h3>
          <div className="ring" style={{ "--p": overall }}><div><b>{overall}%</b></div></div>
          <p className="center muted small">{t("Great progress! Keep learning to achieve your goals.")}</p>
          <div className="mini-stats">
            <div><b>{inProgress.length}</b><span className="muted">{t("In Progress")}</span></div>
            <div><b>{done.length}</b><span className="muted">{t("Completed")}</span></div>
          </div>
          <Link to="/certificates" className="link"><Award size={15} /> {t("My Certificates")} <ArrowRight size={14} /></Link>
        </aside>
      </div>
    </>
  );
}
