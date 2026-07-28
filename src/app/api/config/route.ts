import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getStoreIdFromSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const storeId = await getStoreIdFromSession()
  if (!storeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { config, enabled } = body

  if (!config || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const supabase = createServerClient()
  const { error } = await supabase.from('widget_configs').upsert(
    {
      store_id: storeId,
      widget_type: 'announcement-bar',
      config,
      enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'store_id,widget_type' }
  )

  if (error) {
    console.error('[api/config POST]', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
