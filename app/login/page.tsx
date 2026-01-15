import { LoginForm } from "@/components/login-form"
import { AuthLayout } from "@/components/auth-layout"

export const metadata = {
  title: "Sign In - Dats",
  description: "Sign in to your Dats account",
}

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue exploring US data">
      <LoginForm />
    </AuthLayout>
  )
}
