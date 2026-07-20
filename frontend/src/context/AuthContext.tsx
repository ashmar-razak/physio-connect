import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, RegisterClubBody, RegisterPhysioBody } from "@/api/endpoints";
import { setAuthToken } from "@/api/client";
import type { User } from "@/api/types";

const TOKEN_KEY = "physio-connect/token";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: RegisterPhysioBody | RegisterClubBody) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (stored) {
        setAuthToken(stored);
        try {
          const { user: me } = await authApi.me();
          setUser(me);
        } catch {
          await AsyncStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const applySession = useCallback(async (token: string, nextUser: User) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user: nextUser } = await authApi.login(email, password);
      await applySession(token, nextUser);
      return nextUser;
    },
    [applySession]
  );

  const register = useCallback(
    async (body: RegisterPhysioBody | RegisterClubBody) => {
      const { token, user: nextUser } = await authApi.register(body);
      await applySession(token, nextUser);
      return nextUser;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user: me } = await authApi.me();
    setUser(me);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refreshUser }),
    [user, isLoading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
