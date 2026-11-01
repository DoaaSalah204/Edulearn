import { Link } from "react-router-dom";
import { Users, BookOpen, GraduationCap, DollarSign, ArrowRight } from "lucide-react";
import { api, fmtDate, money, compact } from "../../api";
import { useApp } from "../../context/AppContext";
import { useFetch } from "../../hooks";
import { AreaChart, BarChart, Donut } from "../../components/Charts";
import { Avatar, ErrorBox, Spinner, Thumb } from "../../components/ui";

export default function AdminDashboard() {
  const { t, lang } = useApp();
  const { data, loading, error, reload } = useFetch(() => api("/admin/stats"), []);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const s = data.stats;
  const cards = [[Users, "Total Students", s.students, "violet"], [BookOpen, "Total Courses", s.courses, "blue"], [GraduationCap, "Total Instructors", s.instructors, "cyan"], [DollarSign, "Total Revenue", money(s.revenue), "purple"]];
  const status = { completed: "green", pending: "orange", refunded: "red" };
  return (
    <>
      <div className="stat-grid">
        {cards.map(([I, label, v, c]) => <div key={label} className="card stat"><span className={`cat-icon ${c}`}><I size={22} /></span><div><small className="muted">{t(label)}</small><b>{v}</b></div></div>)}
      </div>
      <div className="dash-grid">
        <section className="card pad span-2"><div className="card-head"><h3>{t("Students Growth")}</h3><small className="muted">{t("Last 12 months")}</small></div><AreaChart data={s.studentsGrowth} /></section>
        <section className="card pad"><div className="card-head"><h3>{t("Course Enrollments")}</h3></div><BarChart data={s.enrollmentsByMonth} /></section>
        <section className="card pad span-2"><div className="card-head"><h3>{t("Recent Orders")}</h3><Link to="/admin/orders" className="link small">{t("View All")} <ArrowRight size={13} /></Link></div>
          <div className="table-wrap"><table className="data"><thead><tr><th>{t("Student")}</th><th>{t("Course")}</th><th>{t("Amount")}</th><th>{t("Status")}</th><th>{t("Date")}</th></tr></thead>
            <tbody>{s.recentOrders.map((o) => <tr key={o.id}><td><div className="cell-user"><Avatar src={o.avatar} name={o.student} size={28} />{o.student}</div></td><td className="clip">{o.course}</td><td>{money(o.amount)}</td><td><span className={`badge ${status[o.status] || "gray"}`}>{t(o.status)}</span></td><td>{fmtDate(o.createdAt, lang)}</td></tr>)}</tbody></table></div>
        </section>
        <section className="card pad"><div className="card-head"><h3>{t("Top Courses")}</h3></div>
          {s.topCourses.map((c) => <Link key={c.id} to={`/courses/${c.id}`} className="top-course"><div className="sum-thumb"><Thumb src={c.thumbnail} alt="" /></div><div><b>{c.title}</b><small className="muted">{compact(c.students)} {t("students")}</small></div></Link>)}
        </section>
        <section className="card pad"><div className="card-head"><h3>{t("System Overview")}</h3></div>
          <div className="overview">
            <Donut center={`${s.publishedCourses}/${s.courses}`} parts={[{ label: "Students", value: s.students, color: "#5b3fe8" }, { label: "Courses", value: s.courses, color: "#22b8cf" }, { label: "Instructors", value: s.instructors, color: "#4c6ef5" }, { label: "Orders", value: s.orders, color: "#a78bfa" }]} />
            <ul className="legend">{[["Students", s.students, "#5b3fe8"], ["Courses", s.courses, "#22b8cf"], ["Instructors", s.instructors, "#4c6ef5"], ["Orders", s.orders, "#a78bfa"]].map(([l, v, c]) => <li key={l}><i style={{ background: c }} />{t(l)}<b>{v}</b></li>)}</ul>
          </div>
        </section>
        <section className="card pad"><div className="card-head"><h3>{t("Revenue")}</h3></div><AreaChart data={s.revenueByMonth} color="#16a37f" w={360} /></section>
      </div>
    </>
  );
}
