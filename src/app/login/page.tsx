import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in · ClipTech Admin",
};

/**
 * Sits outside the (dashboard) group so it renders without the sidebar shell.
 *
 * There is no second factor here even though the login response reports
 * `two_factor_enabled`: cliptech-api issues the session cookie on the first
 * call regardless, so a challenge step would be theatre. It belongs here once
 * the API actually withholds the session pending one.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      {/* LoginForm reads ?next= via useSearchParams, which needs a boundary. */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
