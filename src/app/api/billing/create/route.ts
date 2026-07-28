import { NextResponse } from 'next/server'
import { getStoreIdFromSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase/server'
import { createRecurringCharge } from '@/lib/tiendanube'

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

export async function POST() {
  const storeId = await getStoreIdFromSession()
  if (!storeId) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const supabase = createServerClient()
  const { data: store } = await supabase
    .from('stores')
    .select('id, access_token, plan')
    .eq('id', storeId)
    .single()

  if (!store) {
    return NextResponse.json({ error: 'store_not_found' }, { status: 404 })
  }

  if (store.plan === 'active') {
    return NextResponse.json({ error: 'already_active' }, { status: 400 })
  }

  try {
    const returnUrl = `${APP_URL}/api/billing/callback`
    const charge = await createRecurringCharge(store.id, store.access_token, returnUrl)

    await supabase
      .from('stores')
      .update({ tn_charge_id: charge.id })
      .eq('id', storeId)

    return NextResponse.json({ confirmation_url: charge.confirmation_url })
  } catch (err) {
    console.error('[billing/create]', err)
    return NextResponse.json({ error: 'charge_failed' }, { status: 500 })
  }
}
