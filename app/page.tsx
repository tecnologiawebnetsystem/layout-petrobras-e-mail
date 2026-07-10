import { Suspense } from "react";
import { AuthGate } from "@/components/auth/auth-gate"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <Suspense>
      <AuthGate>
        <LoginForm />
      </AuthGate>
    </Suspense>
  );
}
