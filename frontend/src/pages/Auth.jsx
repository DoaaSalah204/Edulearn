import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, User, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Logo, PasswordInput } from "../components/ui";

export default function Auth({ mode }) {
  const signup = mode === "signup";
  const { t, toast } = useApp();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const user = signup ? await register(form.name, form.email, form.password) : await login(form.email, form.password);
      toast(signup ? t("Account created. Welcome to EduLearn!") : t("Welcome back, {name}!", { name: user.name.split(" ")[0] }));
      const back = location.state?.from;
      navigate(back || (user.role === "admin" ? "/admin" : "/my-learning"), { replace: true });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const social = (name) => toast(t("{name} sign-in is not configured in this demo.", { name }), "info");

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <Logo />
        <form className="auth-card" onSubmit={submit} noValidate={false}>
          <h1>{signup ? t("Create Your Account") : t("Welcome Back!")}</h1>
          <p className="muted">{signup ? t("Join thousands of learners worldwide.") : t("Sign in to your account to continue learning.")}</p>
          {error && <div className="alert error" role="alert">{error}</div>}
          {signup && <label className="field"><span>{t("Full Name")}</span><div className="input-icon"><User size={16} /><input required minLength={2} value={form.name} onChange={set("name")} placeholder={t("Enter your full name")} autoComplete="name" /></div></label>}
          <label className="field"><span>{t("Email Address")}</span><div className="input-icon"><Mail size={16} /><input type="email" required value={form.email} onChange={set("email")} placeholder={t("Enter your email")} autoComplete="email" /></div></label>
          <label className="field"><span>{t("Password")}</span><PasswordInput icon required minLength={signup ? 8 : 1} value={form.password} onChange={set("password")} placeholder={signup ? t("At least 8 characters") : t("Enter your password")} autoComplete={signup ? "new-password" : "current-password"} /></label>
          {!signup && <div className="auth-row"><label className="check"><input type="checkbox" defaultChecked /> {t("Remember me")}</label><Link to="/contact" className="link small">{t("Forgot password?")}</Link></div>}
          {signup && <p className="muted small">{t("By signing up you agree to our Terms of Service and Privacy Policy.")}</p>}
          <button className="btn primary block lg" disabled={busy}>{busy ? t("Please wait...") : signup ? t("Sign Up") : t("Sign In")}</button>
          <div className="divider"><span>{t("or continue with")}</span></div>
          <div className="social-row">{["Google", "Facebook", "Apple"].map((n) => <button key={n} type="button" className="btn outline" onClick={() => social(n)}>{n}</button>)}</div>
          <p className="center muted">{signup ? t("Already have an account?") : t("Don't have an account?")} <Link className="link" to={signup ? "/signin" : "/signup"} state={location.state}>{signup ? t("Sign In") : t("Sign Up")}</Link></p>
          {!signup && <p className="demo-hint center small muted">{t("Demo")}: student@edulearn.com / Student@123</p>}
        </form>
      </div>
      <aside className="auth-art" aria-hidden="true">
        <div className="blob b1" /><div className="blob b2" />
        <div className="auth-art-copy"><Sparkles size={28} /><h2>{t("Continue Your Learning Journey")}</h2><p>{t("Access your courses, track your progress, and achieve your goals.")}</p></div>
      </aside>
    </div>
  );
}
