import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Code2, PenTool, Briefcase, Megaphone, BarChart3, Languages as LangIcon, Camera, Music, Heart as HeartIcon, Globe, BookOpen, Cpu, ArrowRight, PlayCircle, Sparkles, GraduationCap } from "lucide-react";
import { api } from "../api";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks";
import { CourseCard } from "../components/CourseCard";
import { SplitText } from "../components/Motion";
import { Spinner, ErrorBox, Avatar, Reveal, CountUp } from "../components/ui";

const ICONS = { code: Code2, pen: PenTool, briefcase: Briefcase, megaphone: Megaphone, chart: BarChart3, languages: LangIcon, camera: Camera, music: Music, heart: HeartIcon, globe: Globe, book: BookOpen, cpu: Cpu };
const ICON_STYLE = ["cyan", "violet", "purple", "pink", "indigo", "blue"];

export default function Home() {
  const { t, content } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const courses = useFetch(() => api("/courses", { query: { sort: "popular" } }), []);
  const cats = useFetch(() => api("/categories"), []);
  const counts = Object.fromEntries((cats.data?.categories || []).map((c) => [c.name, c.count]));
  const go = (e) => { e.preventDefault(); navigate(`/courses${q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ""}`); };

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={14} /> {t(content.hero.eyebrow)}</span>
            <h1><SplitText text={t(content.hero.title)} start={120} /><br /><span><SplitText text={t(content.hero.highlight)} start={120 + 70 * t(content.hero.title).split(/\s+/).length} /></span></h1>
            <p className="lead">{t(content.hero.text)}</p>
            <form className="hero-search" onSubmit={go} role="search">
              <Search size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search for courses, skills or instructors...")} aria-label={t("Search")} />
              <button className="btn primary" type="submit" data-magnetic aria-label={t("Search")}><Search size={18} /></button>
            </form>
          </div>
          <div className="hero-art" aria-hidden="true" data-parallax="0.06">
            <div className="blob b1" /><div className="blob b2" />
            <div className="hero-card"><GraduationCap size={110} /><b>EduLearn</b></div>
            <img src={content.hero.image} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div className="float-card f1"><PlayCircle size={20} /><div><b>1,200+</b><small>{t("Video lessons")}</small></div></div>
            <div className="float-card f2"><Avatar src="https://randomuser.me/api/portraits/women/44.jpg" name="Sarah" size={34} /><div><b>4.9 ★</b><small>{t("Top rated")}</small></div></div>
          </div>
        </div>
        <div className="container">
          <div className="stats-bar card">
            {content.stats.map((x) => <div key={x.label}><b><CountUp value={x.value} /></b><span className="muted">{t(x.label)}</span></div>)}
          </div>
        </div>
      </section>

      <Reveal as="section" className="section">
        <div className="container">
          <div className="section-head"><h2>{t("Popular Categories")}</h2><Link to="/courses" className="link">{t("View All")} <ArrowRight size={15} /></Link></div>
          <div className="cat-grid">
            {content.categories.map(({ name, icon }, i) => {
              const I = ICONS[icon] || BookOpen;
              return (
                <Link key={name} to={`/courses?category=${encodeURIComponent(name)}`} className="cat-card" style={{ "--i": i }}>
                  <span className={`cat-icon ${ICON_STYLE[i % ICON_STYLE.length]}`}><I size={24} /></span>
                  <b>{t(name)}</b>
                  <small className="muted">{counts[name] || 0} {t((counts[name] || 0) === 1 ? "course" : "courses")}</small>
                </Link>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="section alt">
        <div className="container">
          <div className="section-head"><div><h2>{t("Featured Courses")}</h2><p className="muted">{t("Handpicked courses to help you reach your goals.")}</p></div><Link to="/courses" className="btn outline">{t("View All")}</Link></div>
          {courses.loading ? <Spinner cards /> : courses.error ? <ErrorBox message={courses.error} onRetry={courses.reload} /> : (
            <div className="grid-4">{courses.data.courses.slice(0, 4).map((c) => <CourseCard key={c.id} course={c} />)}</div>
          )}
        </div>
      </Reveal>

      <Reveal as="section" className="section">
        <div className="container">
          <div className="cta-banner">
            <div><h2>{t("Turn your knowledge into someone's future.")}</h2><p>{t("Join our community of expert instructors and inspire learners around the world.")}</p></div>
            <Link to="/instructors" className="btn white">{t("Meet our instructors")} <ArrowRight size={16} /></Link>
          </div>
        </div>
      </Reveal>
    </>
  );
}
