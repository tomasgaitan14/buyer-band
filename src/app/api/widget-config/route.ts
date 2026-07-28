import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

const TRIAL_DAYS = 30

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'no-store',
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawStoreId = searchParams.get('store_id')

  if (!rawStoreId || isNaN(Number(rawStoreId))) {
    return NextResponse.json(null, { status: 400, headers: corsHeaders() })
  }

  const storeId = parseInt(rawStoreId, 10)
  const supabase = createServerClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, plan, trial_started_at')
    .eq('id', storeId)
    .single()

  if (!store) {
    return NextResponse.json(null, { status: 404, headers: corsHeaders() })
  }

  // Verificar acceso según plan
  if (store.plan === 'cancelled') {
    return NextResponse.json({ enabled: false }, { headers: corsHeaders() })
  }

  if (store.plan === 'trial') {
    const trialExpiry = new Date(store.trial_started_at)
    trialExpiry.setDate(trialExpiry.getDate() + TRIAL_DAYS)
    if (new Date() > trialExpiry) {
      return NextResponse.json({ enabled: false }, { headers: corsHeaders() })
    }
  }

  const { data: widgetConfig } = await supabase
    .from('widget_configs')
    .select('config, enabled')
    .eq('store_id', storeId)
    .eq('widget_type', 'announcement-bar')
    .single()

  if (!widgetConfig?.enabled) {
    return NextResponse.json({ enabled: false }, { headers: corsHeaders() })
  }

  return NextResponse.json(
    { enabled: true, config: widgetConfig.config },
    { headers: corsHeaders() }
  )
}
