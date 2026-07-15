import { permanentRedirect } from "next/navigation"

export default function LegacyUsersPage() {
  permanentRedirect("/team")
}
