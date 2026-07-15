import { permanentRedirect } from "next/navigation"

export default function LegacyStorePage() {
  permanentRedirect("/inventory")
}
