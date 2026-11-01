import { useState } from "react";
import { api, fmtDate } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { Empty, ErrorBox, Spinner } from "../../components/ui";

export default function AdminSupport() {
  const { t, toast, lang } = useApp();
  const [tab, setTab] = useState("tickets");
  const [reply, setReply] = useState({});
  const tickets = useFetch(() => api("/admin/support"), []);
  const contact = useFetch(() => api("/admin/contact"), []);

  const patchTicket = async (id, body) => { try { await api(`/admin/support/${id}`, { method: "PATCH", body }); toast(t("Saved.")); setReply((r) => ({ ...r, [id]: "" })); tickets.reload(); } catch (e) { toast(e.message, "error"); } };
  const patchMsg = async (id, status) => { try { await api(`/admin/contact/${id}`, { method: "PATCH", body: { status } }); contact.reload(); } catch (e) { toast(e.message, "error"); } };

  if (tickets.loading || contact.loading) return <Spinner />;
  if (tickets.error) return <ErrorBox message={tickets.error} onRetry={tickets.reload} />;
  const color = { open: "orange", "in-progress": "blue", closed: "green", new: "orange", read: "blue", resolved: "green" };
  return (
    <>
      <div className="page-title"><div><h1>{t("Support")}</h1></div></div>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "tickets"} className={tab === "tickets" ? "active" : ""} onClick={() => setTab("tickets")}>{t("Support Tickets")} ({tickets.data.tickets.length})</button>
        <button role="tab" aria-selected={tab === "contact"} className={tab === "contact" ? "active" : ""} onClick={() => setTab("contact")}>{t("Contact Messages")} ({contact.data?.messages.length ?? 0})</button>
      </div>
      {tab === "tickets" ? (tickets.data.tickets.length === 0 ? <Empty title={t("No tickets yet")} /> : (
        <div className="stack">{tickets.data.tickets.map((x) => (
          <article key={x.id} className="card pad">
            <div className="card-head"><div><h4>{x.subject}</h4><small className="muted">{x.userName} · {x.email} · {fmtDate(x.createdAt, lang)}</small></div>
              <select className="select compact" value={x.status} onChange={(e) => patchTicket(x.id, { status: e.target.value })}>{["open", "in-progress", "closed"].map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></div>
            <p>{x.message}</p>
            {x.replies.map((r) => <p key={r.id} className="reply">↳ {r.message}</p>)}
            <div className="editor-row"><input className="input" placeholder={t("Write a reply...")} value={reply[x.id] || ""} onChange={(e) => setReply({ ...reply, [x.id]: e.target.value })} /><button className="btn primary sm" disabled={!reply[x.id]} onClick={() => patchTicket(x.id, { reply: reply[x.id], status: "in-progress" })}>{t("Reply")}</button></div>
          </article>))}</div>
      )) : (contact.data.messages.length === 0 ? <Empty title={t("No messages yet")} /> : (
        <div className="stack">{contact.data.messages.map((m) => (
          <article key={m.id} className="card pad">
            <div className="card-head"><div><h4>{m.subject || t("(no subject)")}</h4><small className="muted">{m.name} · {m.email} · {fmtDate(m.createdAt, lang)}</small></div>
              <select className="select compact" value={m.status} onChange={(e) => patchMsg(m.id, e.target.value)}>{["new", "read", "resolved"].map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></div>
            <p>{m.message}</p><span className={`badge ${color[m.status]}`}>{t(m.status)}</span>
          </article>))}</div>
      ))}
    </>
  );
}
