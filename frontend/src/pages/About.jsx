import { Link } from "react-router-dom";
import { Sparkles, Users, TrendingUp, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function About() {
  const { t, content } = useApp();
  const values = [[Sparkles, "Quality first", "Thoughtfully crafted courses led by real practitioners."], [Users, "People powered", "A welcoming community that helps you keep growing."], [TrendingUp, "Progress that matters", "Practical skills you can use in your life and career."]];
  return (
    <div className="container page">
      <section className="about-hero">
        <div><span className="eyebrow">{t("Our mission")}</span><h1>{t(content.about.title)}</h1><p className="lead muted">{t(content.about.text)}</p>
          <Link to="/courses" className="btn primary lg">{t("Explore Courses")} <ArrowRight size={16} /></Link></div>
        <div className="mask-img" data-scrub><img src={content.about.image} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} /></div>
      </section>
      <div className="grid-3">{values.map(([I, a, b]) => <div key={a} className="card pad"><span className="cat-icon violet"><I size={22} /></span><h3>{t(a)}</h3><p className="muted">{t(b)}</p></div>)}</div>
    </div>
  );
}
