import { redirect } from 'next/navigation'
import { getStoreIdFromSession } from '@/lib/session'
import { createServerClient } from '@/lib/supabase/server'
import { BandConfigForm } from '@/components/band-config-form'
import { DEFAULT_CONFIG, type BarConfig } from '@/types/widget'

const TRIAL_DAYS = 30

export default async function DashboardPage() {
  const storeId = await getStoreIdFromSession()
  if (!storeId) redirect('/error?reason=not_installed')

  const supabase = createServerClient()

  const { data: store } = await supabase
    .from('stores')
    .select('id, store_url, plan, trial_started_at')
    .eq('id', storeId)
    .single()

  if (!store) redirect('/error?reason=store_not_found')

  const { data: widgetConfig } = await supabase
    .from('widget_configs')
    .select('config, enabled')
    .eq('store_id', storeId)
    .eq('widget_type', 'announcement-bar')
    .single()

  const trialDaysLeft =
    store.plan === 'trial'
      ? Math.max(
          0,
          Math.ceil(
            (new Date(store.trial_started_at).getTime() +
              TRIAL_DAYS * 24 * 60 * 60 * 1000 -
              Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : null

  return (
    <BandConfigForm
      storeId={storeId}
      storeUrl={store.store_url}
      plan={store.plan}
      trialDaysLeft={trialDaysLeft}
      initialConfig={(widgetConfig?.config as BarConfig) ?? DEFAULT_CONFIG}
      initialEnabled={widgetConfig?.enabled ?? true}
    />
  )
}
