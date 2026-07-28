import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServerClient } from '@/lib/supabase/server'

const CLIENT_SECRET = process.env.TIENDANUBE_CLIENT_SECRET!

// TN firma el body con HMAC-SHA256 usando el client_secret
function verifyHmac(rawBody: string, signature: string): boolean {
  if (!signature) return false
  try {
    const expected = crypto
      .createHmac('sha256', CLIENT_SECRET)
      .update(rawBody)
      .digest('base64')
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'base64'),
      Buffer.from(signature, 'base64')
    )
  } catch {
    return false
  }
}

const UNINSTALL_TOPICS = new Set(['store/redact', 'app/uninstalled', 'app/uninstall'])

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  const signature = request.headers.get('x-linkedstore-hmac-sha256') ?? ''
  const topic = request.headers.get('x-linkedstore-topic') ?? ''

  if (!verifyHmac(rawBody, signature)) {
    console.warn('[webhook/tn] HMAC inválido — topic:', topic)
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const storeId = (payload.store_id ?? payload.id) as number | undefined

  if (!storeId) {
    return NextResponse.json({ error: 'missing_store_id' }, { status: 400 })
  }

  if (UNINSTALL_TOPICS.has(topic)) {
    const supabase = createServerClient()

    await Promise.all([
      supabase.from('stores').update({ plan: 'cancelled' }).eq('id', storeId),
      supabase.from('widget_configs').update({ enabled: false }).eq('store_id', storeId),
    ])

    console.log(`[webhook/tn] Store ${storeId} desinstalada — plan cancelado`)
  }

  // Siempre responder 200 para que TN no reintente
  return NextResponse.json({ received: true })
}
