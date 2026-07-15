import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import {
  getSearchValue,
  normalizeAcquisitionSource,
  normalizeBillingCycle,
  normalizeSignupPlan,
} from "@/lib/auth-navigation"

interface OnboardingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const query = await searchParams

  return (
    <OnboardingFlow
      initialPlan={normalizeSignupPlan(getSearchValue(query.plan))}
      initialBillingCycle={normalizeBillingCycle(getSearchValue(query.cycle))}
      acquisitionSource={normalizeAcquisitionSource(getSearchValue(query.source))}
    />
  )
}
