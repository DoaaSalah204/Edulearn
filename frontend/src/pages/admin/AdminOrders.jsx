import { api, fmtDate, money } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { Avatar, Empty, ErrorBox, Spinner } from "../../components/ui";

export default function AdminOrders() {
  const { t, toast, lang } = useApp();
  const { data, loading, error, reload } = useFetch(() => api("/admin/orders"), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const setStatus = async (o, status) => { try { await api(`/admin/orders/${o.id}`, { method: "PATCH", body: { status } }); toast(t("Order updated.")); reload(); } catch (e) { toast(e.message, "error"); } };
  return (
    <>
      <div className="page-title"><div><h1>{t("Orders")}</h1><p className="muted">{data.orders.length} {t("orders")}</p></div></div>
      {data.orders.length === 0 ? <Empty title={t("No orders yet")} /> : (
        <div className="card table-wrap"><table className="data">
          <thead><tr><th>{t("Order")}</th><th>{t("Student")}</th><th>{t("Courses")}</th><th>{t("Amount")}</th><th>{t("Date")}</th><th>{t("Status")}</th></tr></thead>
          <tbody>{data.orders.map((o) => (
            <tr key={o.id}><td><small className="muted">#{o.id.slice(-6)}</small></td><td><div className="cell-user"><Avatar src={o.user.avatar} name={o.user.name} size={28} />{o.user.name}</div></td><td className="clip">{o.items.map((i) => i.title).join(", ")}</td><td>{money(o.amount)}</td><td>{fmtDate(o.createdAt, lang)}</td>
              <td><select className="select compact" value={o.status} onChange={(e) => setStatus(o, e.target.value)}><option value="completed">{t("completed")}</option><option value="pending">{t("pending")}</option><option value="refunded">{t("refunded")}</option></select></td></tr>
          ))}</tbody></table></div>
      )}
    </>
  );
}
