import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getStoreInfo } from '@/lib/tiendanube'
import { createServerClient } from '@/lib/supabase/server'
import { sessionCookieOptions } from '@/lib/session'

// NEXT_PUBLIC_APP_URL tiene prioridad; si no está, usa la URL de producción de Vercel como fallback
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/error?reason=missing_code`)
  }

  try {
    const { access_token, user_id } = await exchangeCodeForToken(code)
    const storeId = parseInt(user_id, 10)

    // store_url es opcional — si la API falla no bloqueamos la instalación
    let storeUrl: string | null = null
    try {
      const storeInfo = await getStoreInfo(storeId, access_token)
      storeUrl = storeInfo.main_domain || storeInfo.original_domain || null
    } catch {
      console.warn('[auth/callback] getStoreInfo failed, proceeding without store_url')
    }

    const supabase = createServerClient()
    const { error } = await supabase.from('stores').upsert({
      id: storeId,
      access_token,
      store_url: storeUrl,
      plan: 'trial',
      trial_started_at: new Date().toISOString(),
    })

    if (error) throw error

    const response = NextResponse.redirect(`${APP_URL}/dashboard`)
    const cookieOpts = sessionCookieOptions(storeId)
    response.cookies.set(cookieOpts)
    return response
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[auth/callback]', err)
    return NextResponse.redirect(
      `${APP_URL}/error?reason=auth_failed&detail=${encodeURIComponent(detail)}`
    )
  }
}
