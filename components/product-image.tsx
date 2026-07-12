interface ProductImageProps {
  src?: string
  alt: string
  className?: string
}

function getSafeImageSource(src?: string) {
  if (!src) return "/placeholder.svg"
  if (src.startsWith("/")) return src

  try {
    const url = new URL(src)
    return url.protocol === "https:" ? url.toString() : "/placeholder.svg"
  } catch {
    return "/placeholder.svg"
  }
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  return (
    // Tenant-managed image hosts cannot be safely allowlisted for the Next.js image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getSafeImageSource(src)}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  )
}
