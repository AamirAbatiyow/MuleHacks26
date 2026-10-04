import { Navigate } from "react-router";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function AdminRoute({ children }: { children: ReactNode }) {
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

  if (!user.isAdmin) {
    if (user.isJudge) return <Navigate to="/judge" replace />;
    return <Navigate to={user.isScanner ? "/scan" : "/dashboard"} replace />;
  }

  return <>{children}</>;
}
