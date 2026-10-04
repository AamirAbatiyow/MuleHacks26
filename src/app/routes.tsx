// Mule Hacks Routes Configuration
import { createBrowserRouter, Navigate } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { WifiPage } from "./pages/WifiPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ScannerRoute } from "./components/ScannerRoute";
import { JudgeRoute } from "./components/JudgeRoute";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ScanPage } from "./pages/ScanPage";
import { JudgePage } from "./pages/JudgePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/wifi",
    element: <WifiPage />,
  },
  {
    path: "/onboarding",
    element: (
      <ProtectedRoute requiresOnboarding={false}>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute requiresOnboarding={true}>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/scan",
    element: (
      <ScannerRoute>
        <ScanPage />
      </ScannerRoute>
    ),
  },
  {
    path: "/judge",
    element: (
      <JudgeRoute>
        <JudgePage />
      </JudgeRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
