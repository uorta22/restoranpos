import { SignupForm } from "@/components/auth/signup-form"
import {
  buildOnboardingPath,
  getSearchValue,
  isInvitationPath,
  normalizeAcquisitionSource,
  normalizeBillingCycle,
  normalizeSignupPlan,
  safeInternalPath,
} from "@/lib/auth-navigation"

interface SignupPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const query = await searchParams
  const plan = normalizeSignupPlan(getSearchValue(query.plan))
  const cycle = normalizeBillingCycle(getSearchValue(query.cycle))
  const source = normalizeAcquisitionSource(getSearchValue(query.source))
  const requestedRedirect = safeInternalPath(getSearchValue(query.redirect), "")
  const onboardingPath = buildOnboardingPath(plan, cycle, source)
  const nextPath = isInvitationPath(requestedRedirect) ? requestedRedirect : onboardingPath
  const loginParams = new URLSearchParams({ redirect: nextPath })

  return (
    <SignupForm
      plan={plan}
      cycle={cycle}
      nextPath={nextPath}
      loginHref={`/login?${loginParams.toString()}`}
      invitationSignup={isInvitationPath(nextPath)}
    />
  )
}
