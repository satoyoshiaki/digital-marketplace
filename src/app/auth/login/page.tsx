import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">出品者・管理者専用ページです</p>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
