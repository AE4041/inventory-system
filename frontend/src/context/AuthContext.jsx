import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/resources";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(({ data }) => {
        setUser(data.data);
        localStorage.setItem("user", JSON.stringify(data.data));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }

  async function registerOrganization(payload) {
    const { data } = await authApi.registerOrganization(payload);
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));
    setUser(data.data.user);
    return data.data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  async function refreshUser() {
    const { data } = await authApi.me();
    setUser(data.data);
    localStorage.setItem("user", JSON.stringify(data.data));
  }

  const value = useMemo(() => ({ user, loading, login, registerOrganization, logout, refreshUser }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
