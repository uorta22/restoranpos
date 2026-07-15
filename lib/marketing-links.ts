function getConfiguredPanelOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_PANEL_URL
  if (!configuredUrl) return null

  try {
    const url = new URL(configuredUrl)
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null
  } catch {
    return null
  }
}

export function getPanelHref(pathname: string) {
  const safePath = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/"
  const panelOrigin = getConfiguredPanelOrigin()
  return panelOrigin ? `${panelOrigin}${safePath}` : safePath
}
