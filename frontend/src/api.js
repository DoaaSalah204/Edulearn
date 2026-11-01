// Single place for every call to the backend. Vite proxies /api -> http://localhost:4000
const TOKEN_KEY = "edulearn-token";
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } };
export const setToken = (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

export async function api(path, { method = "GET", body, query } = {}) {
  let url = `/api${path}`;
  if (query) {
    const p = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
      else if (v !== undefined && v !== null && v !== "") p.append(k, v);
    });
    const s = p.toString();
    if (s) url += `?${s}`;
  }
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error("Cannot reach the server. Make sure the backend is running (npm run dev)."), { status: 0 });
  }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data;
}

export const money = (n) => (Number(n) === 0 ? "Free" : `$${Number(n).toFixed(Number(n) % 1 ? 2 : 0)}`);
export const fmtDate = (iso, lang = "en") => {
  try { return new Date(iso).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" }); } catch { return ""; }
};
export const compact = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}K` : String(n));
