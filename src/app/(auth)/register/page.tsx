import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AuthForm from "@/components/auth-form"
import { getCurrentUser } from "@/lib/user"

export const metadata: Metadata = { title: "Create account" }

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect(`/${user.role}/dashboard`)
  return <AuthForm mode="register" />
}
