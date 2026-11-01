import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, Users, BookOpen } from "lucide-react";
import { api, compact } from "../api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useFetch, useDebounced } from "../hooks";
import { Avatar, Empty, ErrorBox, Spinner } from "../components/ui";

export function InstructorCard({ i, following, onFollow }) {
  const { t } = useApp();
  return (
    <article className="person-card card" data-tilt>
      <Link to={`/instructors/${i.id}`} className="person-photo"><Avatar src={i.avatar} name={i.name} size={96} /></Link>
      <h3><Link to={`/instructors/${i.id}`}>{i.name}</Link></h3>
      <p className="muted small">{i.title}</p>
      <div className="rate center"><Star size={14} fill="currentColor" className="gold" /> <b>{i.rating}</b> <span className="muted">({compact(i.reviewsCount)})</span></div>
      <div className="person-stats">
        <span><BookOpen size={14} /> {i.coursesCount} {t("Courses")}</span>
        <span><Users size={14} /> {compact(i.students)} {t("Students")}</span>
      </div>
      <button className={`btn sm block ${following ? "outline" : "primary"}`} onClick={() => onFollow(i)}>{following ? t("Following") : t("Follow")}</button>
    </article>
  );
}

export default function Instructors() {
  const { t, toast } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [followed, setFollowed] = useState({});
  const { data, loading, error, reload } = useFetch(() => api("/instructors", { query: { search: dq } }), [dq]);

  const follow = async (i) => {
    if (!user) return navigate("/signin", { state: { from: "/instructors" } });
    try { const d = await api(`/instructors/${i.id}/follow`, { method: "POST" }); setFollowed((f) => ({ ...f, [i.id]: d.following })); toast(d.following ? t("You're now following {name}.", { name: i.name }) : t("Unfollowed.")); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="container page">
      <div className="page-title"><div><h1>{t("Our Instructors")}</h1><p className="muted">{t("Learn from people who love what they do.")}</p></div>
        <label className="search-field"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search instructors...")} aria-label={t("Search instructors...")} /></label></div>
      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={reload} /> : data.instructors.length === 0 ? <Empty icon={Users} title={t("No instructors found")} /> : (
        <div className="grid-3">{data.instructors.map((i) => <InstructorCard key={i.id} i={i} following={!!followed[i.id]} onFollow={follow} />)}</div>
      )}
    </div>
  );
}
