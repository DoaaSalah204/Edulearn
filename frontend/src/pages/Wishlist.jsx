import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, Clock } from "lucide-react";
import { api, money } from "../api";
import { useApp } from "../context/AppContext";
import { useShop } from "../context/ShopContext";
import { useFetch } from "../hooks";
import { Empty, ErrorBox, Spinner, Thumb } from "../components/ui";

export default function Wishlist() {
  const { t } = useApp();
  const shop = useShop();
  const navigate = useNavigate();
  const { data, loading, error, reload, setData } = useFetch(() => api("/wishlist"), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const remove = async (courseId) => { await shop.toggleWishlist(courseId); setData({ items: data.items.filter((x) => x.courseId !== courseId) }); };
  return (
    <>
      <div className="page-title"><div><h1>{t("My Wishlist")}</h1><p className="muted">{data.items.length} {t("courses saved for later")}</p></div></div>
      {data.items.length === 0 ? (
        <Empty icon={Heart} title={t("Your wishlist is empty")} text={t("Save courses you're interested in and come back later.")} action={<Link to="/courses" className="btn primary">{t("Browse Courses")}</Link>} />
      ) : (
        <div className="stack">
          {data.items.map(({ id, course }) => (
            <article key={id} className="wish-row card">
              <Link to={`/courses/${course.id}`} className="wish-thumb"><Thumb src={course.thumbnail} alt="" /></Link>
              <div className="wish-info">
                <h3><Link to={`/courses/${course.id}`}>{course.title}</Link></h3>
                <p className="muted small">{course.instructor?.name} · {course.duration}</p>
                <span className="rate"><Star size={13} fill="currentColor" className="gold" /> {course.rating}</span>
              </div>
              <b className="price">{money(course.price)}</b>
              <div className="wish-actions">
                {shop.enrolledIds.includes(course.id)
                  ? <button className="btn outline sm" onClick={() => navigate(`/learn/${course.id}`)}>{t("Go to course")}</button>
                  : <button className="btn primary sm" onClick={() => (course.price === 0 ? navigate(`/courses/${course.id}`) : shop.addToCart(course))}>{course.price === 0 ? t("Enroll Free") : t("Add to Cart")}</button>}
                <button className="icon-btn heart-on" onClick={() => remove(course.id)} aria-label={t("Remove")}><Heart size={17} fill="currentColor" /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
