import { Navigate } from "react-router";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function JudgeRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand flex items-center justify-center text-white/80">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!user.isJudge) {
    if (user.isScanner) return <Navigate to="/scan" replace />;
    return <Navigate to={user.isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
