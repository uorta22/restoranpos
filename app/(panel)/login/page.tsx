import { LoginForm } from "@/components/auth/login-form"
import { getSearchValue, safeInternalPath } from "@/lib/auth-navigation"

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams
  const redirectPath = safeInternalPath(getSearchValue(query.redirect), "/")
  const signupParams = new URLSearchParams()
  if (redirectPath !== "/") signupParams.set("redirect", redirectPath)

  return (
    <LoginForm
      redirectPath={redirectPath}
      signupHref={signupParams.size ? `/signup?${signupParams.toString()}` : "/signup"}
      confirmationFailed={getSearchValue(query.error) === "confirmation_failed"}
    />
  )
}
