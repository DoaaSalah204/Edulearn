import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me").then((d) => setUser(d.user)).catch((e) => { if (e.status === 401 || e.status === 403) setToken(""); }).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(d.token); setUser(d.user); return d.user;
  }, []);
  const register = useCallback(async (name, email, password) => {
    const d = await api("/auth/register", { method: "POST", body: { name, email, password } });
    setToken(d.token); setUser(d.user); return d.user;
  }, []);
  const logout = useCallback(() => { setToken(""); setUser(null); }, []);

  return <AuthCtx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}
