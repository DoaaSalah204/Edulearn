import { Link, useNavigate } from "react-router-dom";
import { Star, Heart, Clock, BarChart3, ShoppingCart, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useShop } from "../context/ShopContext";
import { money, compact } from "../api";
import { Stars, Thumb } from "./ui";

/** Shared logic for wishlist / cart buttons */
export function useCourseActions(course) {
  const { user } = useAuth();
  const { t } = useApp();
  const shop = useShop();
  const navigate = useNavigate();
  const inWishlist = shop.wishlistIds.includes(course.id);
  const enrolled = shop.enrolledIds.includes(course.id);
  const inCart = shop.cart.some((c) => c.id === course.id);
  const needSignIn = () => navigate("/signin", { state: { from: `/courses/${course.id}` } });
  return {
    inWishlist, enrolled, inCart,
    wish: async () => { const r = await shop.toggleWishlist(course.id); if (r === "auth") needSignIn(); },
    cart: () => (course.price === 0 ? navigate(`/courses/${course.id}`) : shop.addToCart(course)),
    label: enrolled ? t("Go to course") : course.price === 0 ? t("Enroll Free") : inCart ? t("In Cart") : t("Add to Cart"),
    user
  };
}

export function CourseCard({ course }) {
  const a = useCourseActions(course);
  const { t } = useApp();
  const navigate = useNavigate();
  return (
    <article className="course-card" data-tilt>
      <Link to={`/courses/${course.id}`} className="course-thumb">
        <Thumb src={course.thumbnail} alt={course.title} />
        <span className="chip float">{t(course.category)}</span>
      </Link>
      <button className={`heart ${a.inWishlist ? "on" : ""}`} onClick={a.wish} aria-label={t("Wishlist")} aria-pressed={a.inWishlist}>
        <Heart size={16} fill={a.inWishlist ? "currentColor" : "none"} />
      </button>
      <div className="course-body">
        <h3><Link to={`/courses/${course.id}`}>{course.title}</Link></h3>
        {course.instructor && <Link to={`/instructors/${course.instructor.id}`} className="muted small">{course.instructor.name}</Link>}
        <div className="course-meta">
          <span className="rate"><Star size={13} fill="currentColor" className="gold" /> <b>{course.rating}</b></span>
          <span className="muted">({compact(course.reviewsCount)})</span>
          <span className="muted"><Clock size={13} /> {course.duration}</span>
        </div>
        <div className="course-foot">
          <div className="price">{money(course.price)}{course.oldPrice > course.price && <del>{money(course.oldPrice)}</del>}</div>
          {a.enrolled
            ? <button className="btn sm outline" onClick={() => navigate(`/learn/${course.id}`)}><Check size={14} /> {t("Go to course")}</button>
            : <button className="btn sm primary" onClick={a.cart}>{course.price === 0 ? t("Enroll Free") : <><ShoppingCart size={14} /> {a.label}</>}</button>}
        </div>
      </div>
    </article>
  );
}

/** Horizontal card used on the Courses list page */
export function CourseRow({ course }) {
  const a = useCourseActions(course);
  const { t } = useApp();
  const navigate = useNavigate();
  return (
    <article className="course-row">
      <Link to={`/courses/${course.id}`} className="row-thumb"><Thumb src={course.thumbnail} alt={course.title} /></Link>
      <div className="row-body">
        <h3><Link to={`/courses/${course.id}`}>{course.title}</Link></h3>
        {course.instructor && <Link to={`/instructors/${course.instructor.id}`} className="muted small">{course.instructor.name}</Link>}
        <div className="course-meta">
          <span className="rate"><b>{course.rating}</b> <Stars value={course.rating} size={13} /></span>
          <span className="muted">({compact(course.reviewsCount)})</span>
          <span className="muted"><Clock size={13} /> {course.duration}</span>
          <span className="muted"><BarChart3 size={13} /> {t(course.level)}</span>
        </div>
      </div>
      <div className="row-side">
        <button className={`heart static ${a.inWishlist ? "on" : ""}`} onClick={a.wish} aria-label={t("Wishlist")} aria-pressed={a.inWishlist}><Heart size={17} fill={a.inWishlist ? "currentColor" : "none"} /></button>
        <div className="price">{money(course.price)}{course.oldPrice > course.price && <del>{money(course.oldPrice)}</del>}</div>
        {a.enrolled
          ? <button className="btn sm outline" onClick={() => navigate(`/learn/${course.id}`)}>{t("Go to course")}</button>
          : <button className="btn sm primary" onClick={a.cart}>{a.label}</button>}
      </div>
    </article>
  );
}
