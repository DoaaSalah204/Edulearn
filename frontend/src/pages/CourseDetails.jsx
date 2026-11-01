import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Star, Clock, BarChart3, Globe, Heart, Share2, PlayCircle, Lock, CheckCircle2, MonitorPlay, Download, Award, Infinity as Inf, Smartphone, Users } from "lucide-react";
import { api, money, compact, fmtDate } from "../api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { useFetch } from "../hooks";
import { useCourseActions } from "../components/CourseCard";
import Reviews from "../components/Reviews";
import { Avatar, Breadcrumbs, ErrorBox, Spinner, Stars, Thumb } from "../components/ui";

export default function CourseDetails() {
  const { id } = useParams();
  const { t, lang, toast } = useApp();
  const { user } = useAuth();
  const shop = useShop();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useFetch(() => api(`/courses/${id}`), [id, user?.id]);
  const course = data?.course;
  const a = useCourseActions(course || { id });

  if (loading) return <Spinner />;
  if (error) return <div className="container page"><ErrorBox message={error} onRetry={reload} /></div>;

  const enrolled = data.enrolled || shop.enrolledIds.includes(course.id);
  const previewLesson = course.sections[0]?.lessons[0];
  const total = course.lessonsCount;

  const buyNow = async () => {
    if (enrolled) return navigate(`/learn/${course.id}`);
    if (!user) return navigate("/signin", { state: { from: `/courses/${course.id}` } });
    if (course.price === 0) {
      setBusy(true);
      try { await api("/enrollments", { method: "POST", body: { courseId: course.id } }); await shop.refreshAccount(); toast(t("You're enrolled! Happy learning.")); navigate(`/learn/${course.id}`); }
      catch (e) { toast(e.message, "error"); } finally { setBusy(false); }
      return;
    }
    shop.addToCart(course); navigate("/checkout");
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast(t("Link copied to clipboard.")); } catch { toast(window.location.href, "info"); }
  };
  const TABS = [["overview", "Overview"], ["curriculum", "Curriculum"], ["instructor", "Instructor"], ["reviews", "Reviews"]];

  return (
    <div className="container page">
      <Breadcrumbs items={[{ label: t("Home"), to: "/" }, { label: t("Courses"), to: "/courses" }, { label: course.title }]} />
      <div className="details-grid">
        <div className="details-main">
          <span className="chip">{t(course.category)}</span>
          <h1>{course.title}</h1>
          <p className="lead muted">{course.description}</p>
          <div className="course-meta big">
            <span className="rate"><b>{course.rating}</b> <Stars value={course.rating} /> <span className="muted">({compact(course.reviewsCount)} {t("reviews")})</span></span>
            <span><Clock size={15} /> {course.duration}</span>
            <span><BarChart3 size={15} /> {t(course.level)}</span>
            <span><Globe size={15} /> {course.language}</span>
            <span><Users size={15} /> {compact(course.students)} {t("students")}</span>
          </div>

          <div className="video-preview">
            {preview && previewLesson?.videoUrl ? (
              <video src={previewLesson.videoUrl} controls autoPlay poster={course.thumbnail} />
            ) : (
              <>
                <Thumb src={course.thumbnail} alt={course.title} />
                <button className="play-big" onClick={() => setPreview(true)} aria-label={t("Preview this course")}><PlayCircle size={34} /></button>
                <span className="preview-label">{t("Preview this course")}</span>
              </>
            )}
          </div>

          <div className="tabs" role="tablist">
            {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}>{t(l)}</button>)}
          </div>

          {tab === "overview" && (
            <section>
              <h3>{t("What you'll learn")}</h3>
              <ul className="learn-list">{course.learn.map((x) => <li key={x}><CheckCircle2 size={18} /> {x}</li>)}</ul>
              <h3>{t("Description")}</h3>
              <p>{course.description}</p>
              <p className="muted small">{t("Last updated")}: {fmtDate(course.updatedAt, lang)}</p>
            </section>
          )}
          {tab === "curriculum" && (
            <section>
              <p className="muted">{course.sections.length} {t("sections")} • {total} {t("lessons")} • {course.duration}</p>
              {course.sections.map((s) => (
                <div key={s.id} className="curr-section card">
                  <h4>{s.title}</h4>
                  {s.lessons.map((l) => (
                    <div key={l.id} className="curr-lesson">
                      {l.locked ? <Lock size={16} /> : <PlayCircle size={16} />}
                      <span>{l.title}</span>
                      {l.preview && !enrolled && <button className="link small" onClick={() => { setTab("overview"); setPreview(true); window.scrollTo({ top: 300, behavior: "smooth" }); }}>{t("Preview")}</button>}
                      <small className="muted">{l.duration}</small>
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}
          {tab === "instructor" && course.instructor && <InstructorBlock id={course.instructor.id} />}
          {tab === "reviews" && <Reviews kind="course" targetId={course.id} onChange={reload} />}
        </div>

        <aside className="price-card card">
          <div className="price-card-thumb"><Thumb src={course.thumbnail} alt="" /></div>
          <div className="price-line">
            <b className="price-big">{money(course.price)}</b>
            {course.oldPrice > course.price && <><del className="muted">{money(course.oldPrice)}</del><span className="badge green">{Math.round((1 - course.price / course.oldPrice) * 100)}% {t("OFF")}</span></>}
          </div>
          {enrolled ? (
            <button className="btn primary block lg" onClick={() => navigate(`/learn/${course.id}`)}>{t("Continue Learning")}</button>
          ) : (
            <>
              {course.price > 0 && <button className="btn primary block lg" onClick={a.cart}>{a.inCart ? t("In Cart") : t("Add to Cart")}</button>}
              <button className={`btn block lg ${course.price > 0 ? "outline" : "primary"}`} onClick={buyNow} disabled={busy}>{course.price === 0 ? t("Enroll Free") : t("Buy Now")}</button>
            </>
          )}
          <div className="two-btn">
            <button className={`btn outline sm ${a.inWishlist ? "on" : ""}`} onClick={a.wish}><Heart size={15} fill={a.inWishlist ? "currentColor" : "none"} /> {t("Add to Wishlist")}</button>
            <button className="btn outline sm" onClick={share}><Share2 size={15} /> {t("Share")}</button>
          </div>
          <h4>{t("This course includes")}:</h4>
          <ul className="includes">
            <li><MonitorPlay size={16} /> {course.duration} {t("on-demand video")}</li>
            <li><Download size={16} /> {t("Downloadable resources")}</li>
            <li><Inf size={16} /> {t("Full lifetime access")}</li>
            <li><Award size={16} /> {t("Certificate of completion")}</li>
            <li><Smartphone size={16} /> {t("Access on mobile and TV")}</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function InstructorBlock({ id }) {
  const { t } = useApp();
  const { data, loading } = useFetch(() => api(`/instructors/${id}`), [id]);
  if (loading) return <Spinner />;
  const i = data.instructor;
  return (
    <section className="card instructor-block">
      <Avatar src={i.avatar} name={i.name} size={84} />
      <div>
        <h3><Link to={`/instructors/${i.id}`}>{i.name}</Link></h3>
        <p className="muted">{i.title}</p>
        <div className="course-meta"><span className="rate"><Star size={14} fill="currentColor" className="gold" /> {i.rating}</span><span>{compact(i.students)} {t("students")}</span><span>{i.coursesCount} {t("courses")}</span></div>
        <p>{i.bio}</p>
        <Link to={`/instructors/${i.id}`} className="btn outline sm">{t("View profile")}</Link>
      </div>
    </section>
  );
}
