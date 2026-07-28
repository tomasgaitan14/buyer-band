import { createClient } from '@supabase/supabase-js'

// Cliente server-side con service_role — nunca exponer al browser
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
