import { api, fmtDate } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { Stars, ErrorBox, Spinner, Empty } from "../../components/ui";
import { Trash2 } from "lucide-react";

export default function AdminReviews() {
  const { t, toast, lang } = useApp();
  const { data, loading, error, reload } = useFetch(() => api("/reviews"), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const remove = async (r) => { if (!window.confirm(t("Delete this review?"))) return; try { await api(`/reviews/${r.id}`, { method: "DELETE" }); toast(t("Review deleted.")); reload(); } catch (e) { toast(e.message, "error"); } };
  return (
    <>
      <div className="page-title"><div><h1>{t("Reviews")}</h1><p className="muted">{data.total} {t("reviews")}</p></div></div>
      {data.reviews.length === 0 ? <Empty title={t("No reviews yet.")} /> : (
        <div className="card table-wrap"><table className="data">
          <thead><tr><th>{t("Student")}</th><th>{t("Type")}</th><th>{t("Rating")}</th><th>{t("Review")}</th><th>{t("Date")}</th><th /></tr></thead>
          <tbody>{data.reviews.map((r) => (
            <tr key={r.id}><td>{r.name}</td><td><span className="badge blue">{t(r.kind)}</span></td><td><Stars value={r.rating} size={12} /></td><td className="clip wide-clip">{r.text}</td><td>{fmtDate(r.createdAt, lang)}</td>
              <td><button className="icon-btn danger" onClick={() => remove(r)} aria-label={t("Delete")}><Trash2 size={15} /></button></td></tr>
          ))}</tbody></table></div>
      )}
    </>
  );
}
