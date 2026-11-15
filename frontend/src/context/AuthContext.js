"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const response = await api.get("/auth/me");
    setUser(response.data.data);
    return response.data.data;
  }, []);

  useEffect(() => {
    if (!window.localStorage.getItem("queue-manager-token")) {
      setLoading(false);
      return;
    }
    refreshProfile().catch(() => setUser(null)).finally(() => setLoading(false));
  }, [refreshProfile]);

  const signIn = useCallback(async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    window.localStorage.setItem("queue-manager-token", data.data.accessToken);
    setUser(data.data.user);
  }, []);

  const register = useCallback(async (values) => {
    const { data } = await api.post("/auth/register", values);
    window.localStorage.setItem("queue-manager-token", data.data.accessToken);
    setUser(data.data.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (window.localStorage.getItem("queue-manager-token")) await api.post("/auth/logout");
    } finally {
      window.localStorage.removeItem("queue-manager-token");
      setUser(null);
    }
  }, []);

  const value = useMemo(() => ({ user, loading, signIn, register, signOut, refreshProfile, setUser }), [
    user, loading, signIn, register, signOut, refreshProfile,
  ]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
