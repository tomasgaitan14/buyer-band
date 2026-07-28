import { NextRequest, NextResponse } from 'next/server'
import { getStoreIdFromSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase/server'
import { getRecurringCharge, activateRecurringCharge } from '@/lib/tiendanube'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const chargeIdRaw = searchParams.get('charge_id')

  if (!chargeIdRaw || isNaN(Number(chargeIdRaw))) {
    return NextResponse.redirect(`${APP_URL}/error?reason=billing_invalid`)
  }

  const chargeId = parseInt(chargeIdRaw, 10)

  const storeId = await getStoreIdFromSession()
  if (!storeId) {
    return NextResponse.redirect(`${APP_URL}/error?reason=not_installed`)
  }

  const supabase = createServerClient()
  const { data: store } = await supabase
    .from('stores')
    .select('id, access_token')
    .eq('id', storeId)
    .single()

  if (!store) {
    return NextResponse.redirect(`${APP_URL}/error?reason=store_not_found`)
  }

  try {
    const charge = await getRecurringCharge(store.id, store.access_token, chargeId)

    if (charge.status !== 'accepted') {
      // El merchant rechazó o está pendiente — volver a billing
      return NextResponse.redirect(`${APP_URL}/billing?declined=1`)
    }

    await activateRecurringCharge(store.id, store.access_token, chargeId)

    await supabase
      .from('stores')
      .update({ plan: 'active', tn_charge_id: chargeId })
      .eq('id', storeId)

    return NextResponse.redirect(`${APP_URL}/dashboard`)
  } catch (err) {
    console.error('[billing/callback]', err)
    return NextResponse.redirect(`${APP_URL}/error?reason=billing_failed`)
  }
}
