"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, getToken, setToken } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role?: "ORGANIZER" | "SPECTATOR",
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  accessToken: string;
  user: User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    apiFetch<User>("/auth/me")
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const response = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(response.accessToken);
    setUser(response.user);
  }

  async function register(
    email: string,
    password: string,
    name: string,
    role?: "ORGANIZER" | "SPECTATOR",
  ) {
    const response = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name, role }),
    });
    setToken(response.accessToken);
    setUser(response.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
