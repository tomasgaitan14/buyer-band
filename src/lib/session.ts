import { cookies } from 'next/headers'

const COOKIE_NAME = 'buyer-band-store'

export async function getStoreIdFromSession(): Promise<number | null> {
  const store = await cookies()
  const val = store.get(COOKIE_NAME)?.value
  if (!val || isNaN(Number(val))) return null
  return parseInt(val, 10)
}

export function sessionCookieOptions(storeId: number) {
  return {
    name: COOKIE_NAME,
    value: storeId.toString(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 365,
  }
}
