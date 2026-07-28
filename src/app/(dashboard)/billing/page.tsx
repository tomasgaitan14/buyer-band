'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function BillingContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const declined = searchParams.get('declined') === '1'

  async function handleActivate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/create', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.confirmation_url) {
        throw new Error(data.error ?? 'Error al crear la suscripción')
      }
      window.location.href = data.confirmation_url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-sm w-full space-y-6">
        {declined && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
            Cancelaste el proceso de pago. Podés intentarlo de nuevo cuando quieras.
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-6">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-gray-900">Activá tu suscripción</h1>
            <p className="text-sm text-gray-500">
              Tu período de prueba gratuito venció. Para seguir usando Buyer Band necesitás
              activar la suscripción mensual.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="font-medium text-gray-900">Buyer Band</span>
              <span className="text-2xl font-bold text-gray-900">USD 9.99</span>
            </div>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>✓ Barra de anuncio ilimitada</li>
              <li>✓ Mensajes rotantes con animaciones</li>
              <li>✓ Personalización completa</li>
              <li>✓ Cobrado mensualmente por Tiendanube</li>
            </ul>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleActivate}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Redirigiendo a Tiendanube...' : 'Activar por USD 9.99/mes'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            El pago es procesado de forma segura por Tiendanube. Podés cancelar cuando quieras.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  )
}
