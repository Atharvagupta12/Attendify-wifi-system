import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AuthForm from "@/components/auth-form"
import { getCurrentUser } from "@/lib/user"
import { isDemoAvailable } from "@/lib/demo"

export const metadata: Metadata = { title: "Create account" }

export default async function RegisterPage() {
  const [user, showDemo] = await Promise.all([getCurrentUser(), isDemoAvailable()])
  if (user) redirect(`/${user.role}/dashboard`)
  return <AuthForm mode="register" showDemo={showDemo} />
}
