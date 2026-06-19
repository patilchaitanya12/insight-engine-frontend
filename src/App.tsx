import { useEffect } from "react";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import SignInPage from "./pages/Signinpage";
import SSOCallback from "./pages/SSOCallback";
import { Analytics } from "@vercel/analytics/react";
import { setupAuthInterceptor } from "./services/api";

// Wires Clerk's getToken() into the axios instance.
// Runs once per app load — every subsequent api.* call automatically
// includes "Authorization: Bearer <clerk_jwt>".
function AuthBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setupAuthInterceptor(() => getToken());
  }, [getToken]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthBridge />
        <Routes>

          {/* Custom sign-in page — no Clerk branding */}
          <Route
            path="/sign-in"
            element={
              <>
                <SignedOut>
                  <SignInPage />
                </SignedOut>
                <SignedIn>
                  <Navigate to="/" replace />
                </SignedIn>
              </>
            }
          />

          {/* Google OAuth redirect handler */}
          <Route path="/sso-callback" element={<SSOCallback />} />

          {/* Protected dashboard */}
          <Route
            path="/"
            element={
              <>
                <SignedIn>
                  <Dashboard />
                </SignedIn>
                <SignedOut>
                  <Navigate to="/sign-in" replace />
                </SignedOut>
              </>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </BrowserRouter>

      <Analytics />
    </ThemeProvider>
  );
}