import RegisterForm from "@/components/auth/register-form";
import AuthLayout from "@/components/auth/auth-layout";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}
