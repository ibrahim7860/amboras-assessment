"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "./api";

interface Store {
  id: string;
  name: string;
}

interface AuthContextValue {
  token: string | null;
  store: Store | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedStore = localStorage.getItem("store");
    if (savedToken) setToken(savedToken);
    if (savedStore) {
      try {
        setStore(JSON.parse(savedStore));
      } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Login failed");
      }

      const data: { accessToken: string; store: Store } = await response.json();
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("store", JSON.stringify(data.store));
      setToken(data.accessToken);
      setStore(data.store);
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("store");
    setToken(null);
    setStore(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ token, store, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
