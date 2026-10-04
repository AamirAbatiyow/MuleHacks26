import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { ReactNode } from 'react';
import { needsRegistrationAnswers, RegistrationPrompt } from './RegistrationPrompt';

interface ProtectedRouteProps {
  children: ReactNode;
  requiresOnboarding?: boolean;
}

export function ProtectedRoute({ children, requiresOnboarding = false }: ProtectedRouteProps) {
  const { user, loading, updateUserProfile } = useAuth();

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

  if (user.isJudge) {
    return <Navigate to="/judge" replace />;
  }

  if (user.isScanner) {
    return <Navigate to="/scan" replace />;
  }

  if (user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (requiresOnboarding && !user.hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      {children}
      {needsRegistrationAnswers(user) && <RegistrationPrompt onSubmit={updateUserProfile} />}
    </>
  );
}
