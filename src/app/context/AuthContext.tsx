import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { apiFetch, ApiError, getToken, setToken } from "@/lib/api";

export interface User {
  email: string;
  name?: string;
  university?: string;
  major?: string;
  year?: string;
  phone?: string;
  dietaryRestrictions?: string;
  shirtSize?: string;
  github?: string;
  linkedin?: string;
  hasCompletedOnboarding: boolean;
  rulesAcknowledged?: boolean;
  rulesAcknowledgedAt?: string | null;
  studentLevel?: "high_school" | "undergraduate" | "graduate" | null;
  teamPreference?: "have_team" | "solo" | "make_team" | null;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ isAdmin: boolean }>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (profile: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let providerCount = 0;

export function AuthProvider({ children }: { children: ReactNode }) {
  const instanceId = useRef(++providerCount);

  useEffect(() => {
    if (providerCount > 1) {
      console.warn(
        `Multiple AuthProvider instances detected (${providerCount}). This may cause issues.`
      );
    }
    return () => {
      providerCount--;
    };
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const data = await apiFetch<{ user: User }>("/api/auth/me");
        if (!cancelled) setUser(data.user);
      } catch {
        setToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiFetch<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setUser(data.user);
      return { isAdmin: Boolean(data.user.isAdmin) };
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Login failed");
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const data = await apiFetch<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Registration failed");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("users");
    } catch {
      // ignore
    }
  };

  const updateUserProfile = async (profile: Partial<User>) => {
    if (!user) return;
    try {
      const data = await apiFetch<{ user: User }>("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      setUser(data.user);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw new Error("Failed to update profile");
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUserProfile }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
