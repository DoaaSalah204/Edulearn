import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, Users, BookOpen, Briefcase } from "lucide-react";
import { api, compact } from "../api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks";
import { CourseCard } from "../components/CourseCard";
import Reviews from "../components/Reviews";
import { Avatar, Breadcrumbs, ErrorBox, Spinner, Stars } from "../components/ui";

export default function InstructorProfile() {
  const { id } = useParams();
  const { t, toast } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("about");
  const [following, setFollowing] = useState(false);
  const { data, loading, error, reload } = useFetch(() => api(`/instructors/${id}`), [id, user?.id]);
  useEffect(() => { if (data) setFollowing(data.following); }, [data]);

  if (loading) return <Spinner />;
  if (error) return <div className="container page"><ErrorBox message={error} onRetry={reload} /></div>;
  const i = data.instructor;

  const follow = async () => {
    if (!user) return navigate("/signin", { state: { from: `/instructors/${id}` } });
    try { const d = await api(`/instructors/${id}/follow`, { method: "POST" }); setFollowing(d.following); toast(d.following ? t("You're now following {name}.", { name: i.name }) : t("Unfollowed.")); reload(); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: t("Home"), to: "/" }, { label: t("Instructors"), to: "/instructors" }, { label: i.name }]} />
      <section className="profile-hero card">
        <Avatar src={i.avatar} name={i.name} size={140} />
        <div className="profile-hero-info">
          <h1>{i.name}</h1>
          <p className="muted">{i.title}</p>
          <div className="course-meta big"><span className="rate"><Star size={15} fill="currentColor" className="gold" /> <b>{i.rating}</b> ({compact(i.reviewsCount)} {t("reviews")})</span></div>
        </div>
        <div className="hero-stats">
          <div><b>{i.coursesCount}</b><span className="muted">{t("Courses")}</span></div>
          <div><b>{compact(i.students)}</b><span className="muted">{t("Students")}</span></div>
          <div><b>{i.experience}</b><span className="muted">{t("Years Experience")}</span></div>
        </div>
        <button className={`btn ${following ? "outline" : "primary"}`} onClick={follow}>{following ? t("Following") : t("Follow")} {i.followersCount > 0 && `· ${compact(i.followersCount)}`}</button>
      </section>

      <div className="tabs" role="tablist">
        {[["about", "About"], ["courses", "Courses"], ["reviews", "Reviews"]].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(l)}{k === "courses" ? ` (${data.courses.length})` : ""}</button>)}
      </div>

      {tab === "about" && (
        <div className="grid-2-1">
          <section className="card pad"><h3>{t("About")}</h3><p>{i.bio}</p>
            <h4>{t("Expertise")}</h4><div className="chips">{i.expertise.map((x) => <span key={x} className="chip">{x}</span>)}</div></section>
          <section><h3>{t("Top Courses")}</h3>
            <div className="mini-courses">{data.courses.slice(0, 3).map((c) => (
              <button key={c.id} className="mini-course card" onClick={() => navigate(`/courses/${c.id}`)}><img src={c.thumbnail} alt="" /><div><b>{c.title}</b><small className="muted">{c.rating} ★ · {c.duration}</small></div><span className="price">${c.price}</span></button>
            ))}</div>
          </section>
        </div>
      )}
      {tab === "courses" && <div className="grid-3">{data.courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>}
      {tab === "reviews" && <Reviews kind="instructor" targetId={i.id} onChange={reload} />}
    </div>
  );
}
