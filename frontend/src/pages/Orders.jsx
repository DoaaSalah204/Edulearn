import { Link } from "react-router-dom";
import { Receipt } from "lucide-react";
import { api, fmtDate, money } from "../api";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks";
import { Empty, ErrorBox, Spinner } from "../components/ui";

export default function Orders() {
  const { t, lang } = useApp();
  const { data, loading, error, reload } = useFetch(() => api("/orders"), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <>
      <div className="page-title"><div><h1>{t("Order History")}</h1><p className="muted">{t("All your course purchases in one place.")}</p></div></div>
      {data.orders.length === 0 ? <Empty icon={Receipt} title={t("No orders yet")} action={<Link to="/courses" className="btn primary">{t("Browse Courses")}</Link>} /> : (
        <div className="card table-wrap">
          <table className="data">
            <thead><tr><th>{t("Order")}</th><th>{t("Courses")}</th><th>{t("Date")}</th><th>{t("Payment")}</th><th>{t("Amount")}</th><th>{t("Status")}</th></tr></thead>
            <tbody>{data.orders.map((o) => (
              <tr key={o.id}><td><small className="muted">#{o.id.slice(-6)}</small></td><td>{o.items.map((i) => i.title).join(", ")}</td><td>{fmtDate(o.createdAt, lang)}</td><td>{t(o.paymentMethod === "card" ? "Credit Card" : o.paymentMethod === "paypal" ? "PayPal" : "Apple Pay")}</td><td><b>{money(o.amount)}</b></td><td><span className={`badge ${o.status === "completed" ? "green" : o.status === "pending" ? "orange" : "red"}`}>{t(o.status)}</span></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
