import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translate } from "../i18n";
import { api } from "../api";
import { mergeContent } from "../siteDefaults";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const read = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => read("edulearn-theme", "light"));
  const [lang, setLang] = useState(() => read("edulearn-lang", "en"));
  const [toasts, setToasts] = useState([]);
  const [settings, setSettings] = useState({});
  const reloadSite = useCallback(() => api("/settings").then((d) => setSettings(d.settings || {})).catch(() => {}), []);
  useEffect(() => { reloadSite(); }, [reloadSite]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    write("edulearn-theme", theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    write("edulearn-lang", lang);
  }, [lang]);

  const t = useCallback((text, vars) => translate(lang, text, vars), [lang]);
  const toast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { id, message, type }]);
    setTimeout(() => setToasts((x) => x.filter((i) => i.id !== id)), 3200);
  }, []);

  const value = useMemo(() => ({
    theme, lang, t, toast, settings, content: mergeContent(settings.content), reloadSite,
    toggleTheme: () => setTheme((x) => (x === "light" ? "dark" : "light")),
    toggleLang: () => setLang((x) => (x === "en" ? "ar" : "en"))
  }), [theme, lang, t, toast, settings, reloadSite]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((x) => <div key={x.id} className={`toast ${x.type}`}>{x.message}</div>)}
      </div>
    </AppCtx.Provider>
  );
}
