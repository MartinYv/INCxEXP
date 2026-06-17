import { createContext, useContext, useMemo, useState } from "react";
import { AuthResponse } from "../types";

interface AuthContextValue {
  token: string | null;
  expiration: string | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("incxexp-token");
  });
  const [expiration, setExpiration] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("incxexp-expiration");
  });

  const login = (response: AuthResponse) => {
    setToken(response.token);
    setExpiration(response.expiration);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("incxexp-token", response.token);
      window.localStorage.setItem("incxexp-expiration", response.expiration);
    }
  };

  const logout = () => {
    setToken(null);
    setExpiration(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("incxexp-token");
      window.localStorage.removeItem("incxexp-expiration");
    }
  };

  const value = useMemo(
    () => ({ token, expiration, login, logout }),
    [token, expiration],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
