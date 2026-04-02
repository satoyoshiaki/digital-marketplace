import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <AuthForm mode="login" />
    </div>
  );
}
