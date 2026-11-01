import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function NotFound() {
  const { t } = useApp();
  return (
    <div className="container page center-page">
      <h1 className="big-404">404</h1>
      <h2>{t("Page not found")}</h2>
      <p className="muted">{t("The page you are looking for doesn't exist or was moved.")}</p>
      <Link to="/" className="btn primary">{t("Back to Home")}</Link>
    </div>
  );
}
