import { Trash2 } from "lucide-react";
import { api, fmtDate } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { Empty, ErrorBox, Spinner } from "../../components/ui";

export default function AdminCertificates() {
  const { t, toast, lang } = useApp();
  const { data, loading, error, reload } = useFetch(() => api("/admin/certificates"), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const revoke = async (c) => {
    if (!window.confirm(t("Revoke this certificate?"))) return;
    try { await api(`/admin/certificates/${c.id}`, { method: "DELETE" }); toast(t("Certificate revoked.")); reload(); } catch (e) { toast(e.message, "error"); }
  };
  return (
    <>
      <div className="page-title"><div><h1>{t("Certificates")}</h1><p className="muted">{data.certificates.length} {t("issued")}</p></div></div>
      {data.certificates.length === 0 ? <Empty title={t("No certificates issued yet")} text={t("They appear automatically when a student finishes all lessons and passes the quiz.")} /> : (
        <div className="card table-wrap"><table className="data">
          <thead><tr><th>{t("Code")}</th><th>{t("Student")}</th><th>{t("Course")}</th><th>{t("Date")}</th><th /></tr></thead>
          <tbody>{data.certificates.map((c) => (
            <tr key={c.id}><td><b>{c.code}</b></td><td>{c.userName}</td><td className="clip">{c.courseTitle}</td><td>{fmtDate(c.issuedAt, lang)}</td>
              <td><button className="icon-btn danger" onClick={() => revoke(c)} aria-label={t("Delete")}><Trash2 size={15} /></button></td></tr>
          ))}</tbody></table></div>
      )}
    </>
  );
}
