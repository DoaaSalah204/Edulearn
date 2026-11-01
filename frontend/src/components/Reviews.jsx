import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { api, fmtDate } from "../api";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { useFetch } from "../hooks";
import { Avatar, Spinner, Stars } from "./ui";

/** Reviews list + form, used for both courses and instructors. onChange lets the page refresh its rating. */
export default function Reviews({ kind, targetId, onChange, canReview = true }) {
  const { t, lang, toast } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, reload } = useFetch(() => api("/reviews", { query: { kind, targetId } }), [kind, targetId]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return navigate("/signin", { state: { from: window.location.pathname } });
    setBusy(true);
    try {
      await api("/reviews", { method: "POST", body: { kind, targetId, rating, text } });
      setText(""); toast(t("Thanks! Your review was saved.")); reload(); onChange && onChange();
    } catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };
  const remove = async (id) => {
    try { await api(`/reviews/${id}`, { method: "DELETE" }); reload(); onChange && onChange(); } catch (err) { toast(err.message, "error"); }
  };

  return (
    <div className="reviews">
      {canReview && (
        <form className="review-form card" onSubmit={submit}>
          <b>{t("Your rating")}</b>
          <div className="rating-pick" role="radiogroup" aria-label={t("Your rating")}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} role="radio" aria-checked={rating === n} className={n <= rating ? "on" : ""} onClick={() => setRating(n)} aria-label={`${n}`}><Star size={24} fill="currentColor" /></button>
            ))}
          </div>
          <textarea className="textarea" required minLength={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Share your experience...")} />
          <div><button className="btn primary" disabled={busy}>{user ? t("Submit review") : t("Sign in to review")}</button></div>
        </form>
      )}
      {loading ? <Spinner /> : data.reviews.length === 0 ? <p className="muted">{t("No reviews yet. Be the first to leave one!")}</p> : (
        <ul className="review-list">
          {data.reviews.map((r) => (
            <li key={r.id} className="review">
              <Avatar src={r.avatar} name={r.name} size={42} />
              <div>
                <div className="review-head"><b>{r.name}</b><Stars value={r.rating} size={13} /><small className="muted">{fmtDate(r.createdAt, lang)}</small></div>
                <p>{r.text}</p>
                {user && (user.role === "admin" || user.id === r.userId) && <button className="link small danger-text" onClick={() => remove(r.id)}>{t("Delete")}</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
