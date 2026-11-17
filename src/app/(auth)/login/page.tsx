import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AuthForm from "@/components/auth-form"
import { getCurrentUser } from "@/lib/user"

export const metadata: Metadata = { title: "Log in" }

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect(`/${user.role}/dashboard`)
  return <AuthForm mode="login" />
}
