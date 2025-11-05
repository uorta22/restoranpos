// JWT token oluştur
export async function createToken(payload: any, expiresIn = "7d") {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET çevre değişkeni tanımlanmamış")
  }

  const jwt = await import("jsonwebtoken")
  return jwt.sign(payload, secret, { expiresIn })
}

// JWT token doğrula
export async function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET çevre değişkeni tanımlanmamış")
  }

  try {
    const jwt = await import("jsonwebtoken")
    return jwt.verify(token, secret)
  } catch (error) {
    return null
  }
}

// Token'ı çerezlere kaydet
export function setTokenCookie(token: string) {
  if (typeof document !== "undefined") {
    document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`
  }
}

// Token'ı çerezlerden al
export function getTokenFromCookies() {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";")
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === "auth_token") {
      return value
    }
  }
  return null
}

// Token'ı çerezlerden sil
export function removeTokenCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "auth_token=; path=/; max-age=0;"
  }
}
