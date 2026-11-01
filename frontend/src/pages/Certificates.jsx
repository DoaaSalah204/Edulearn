import { useState } from "react";
import { Link } from "react-router-dom";
import { Award, Printer } from "lucide-react";
import { api, fmtDate } from "../api";
import { useApp } from "../context/AppContext";
import { useFetch } from "../hooks";
import { Empty, ErrorBox, Logo, Modal, Spinner } from "../components/ui";

function CertificateView({ c }) {
  const { t, lang } = useApp();
  return (
    <div className="certificate" id="certificate-print">
      <div className="cert-inner">
        <Logo />
        <small className="cert-kicker">{t("CERTIFICATE OF COMPLETION")}</small>
        <p className="muted">{t("This certificate is proudly presented to")}</p>
        <h2 className="cert-name">{c.userName}</h2>
        <p className="muted">{t("for successfully completing the course")}</p>
        <h3 className="cert-course">{c.courseTitle}</h3>
        <div className="cert-foot">
          <div><b>{fmtDate(c.issuedAt, lang)}</b><small className="muted">{t("Date")}</small></div>
          <div className="seal"><Award size={30} /></div>
          <div><b>{c.instructorName}</b><small className="muted">{t("Instructor")}</small></div>
        </div>
        <small className="muted">{t("Certificate ID")}: {c.code}</small>
      </div>
    </div>
  );
}

export default function Certificates() {
  const { t, lang } = useApp();
  const [view, setView] = useState(null);
  const { data, loading, error, reload } = useFetch(() => api("/certificates"), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <>
      <div className="page-title"><div><h1>{t("My Certificates")}</h1><p className="muted">{t("Celebrate the skills you've worked hard to build.")}</p></div></div>
      {data.certificates.length === 0 ? (
        <Empty icon={Award} title={t("No certificates yet")} text={t("Complete all lessons and pass the quiz of a course to earn your certificate.")} action={<Link to="/my-learning" className="btn primary">{t("Go to My Learning")}</Link>} />
      ) : (
        <div className="cert-list">
          {data.certificates.map((c) => (
            <article key={c.id} className="card cert-card">
              <div className="cert-mini"><Award size={30} /><small>{t("CERTIFICATE")}</small><b>{c.courseTitle}</b></div>
              <div className="cert-info">
                <h3>{c.courseTitle}</h3>
                <p className="muted small">{t("Issued by")} EduLearn</p>
                <p className="muted small">{t("Completed on")} {fmtDate(c.issuedAt, lang)}</p>
              </div>
              <button className="btn outline sm" onClick={() => setView(c)}>{t("View Certificate")}</button>
            </article>
          ))}
        </div>
      )}
      {view && (
        <Modal title={t("Certificate")} onClose={() => setView(null)} wide>
          <CertificateView c={view} />
          <div className="modal-actions"><button className="btn primary" onClick={() => window.print()}><Printer size={16} /> {t("Print / Save as PDF")}</button></div>
        </Modal>
      )}
    </>
  );
}
