import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// Clerk redirects here after Google OAuth completes.
// This component finishes the handshake and redirects to "/"
export default function SSOCallback() {
  return (
    <AuthenticateWithRedirectCallback
      signUpForceRedirectUrl="/"
      signInForceRedirectUrl="/"
    />
  );
}