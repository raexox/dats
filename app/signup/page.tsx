import { SignupForm } from "@/components/signup-form"
import { AuthLayout } from "@/components/auth-layout"

export const metadata = {
  title: "Create Account - Dats",
  description: "Create a new Dats account",
}

export default function SignupPage() {
  return (
    <AuthLayout title="Get Started" subtitle="Create an account to explore US data maps">
      <SignupForm />
    </AuthLayout>
  )
}
