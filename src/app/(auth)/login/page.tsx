import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AuthForm from "@/components/auth-form"
import { getCurrentUser } from "@/lib/user"
import { isDemoAvailable } from "@/lib/demo"

export const metadata: Metadata = { title: "Log in" }

export default async function LoginPage() {
  const [user, showDemo] = await Promise.all([getCurrentUser(), isDemoAvailable()])
  if (user) redirect(`/${user.role}/dashboard`)
  return <AuthForm mode="login" showDemo={showDemo} />
}
