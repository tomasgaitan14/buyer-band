const REASONS: Record<string, string> = {
  missing_code: 'No se recibió el código de autorización de Tiendanube.',
  auth_failed: 'No pudimos completar la instalación. Intentá de nuevo desde el marketplace.',
  not_installed: 'No encontramos una sesión activa. Instalá la app desde el marketplace de Tiendanube.',
  store_not_found: 'La tienda no está registrada. Intentá reinstalar la app.',
}

export default function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>
}) {
  return searchParams.then(({ reason }) => {
    const message = (reason && REASONS[reason]) ?? 'Ocurrió un error inesperado.'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-sm w-full bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
          <p className="text-2xl">⚠️</p>
          <h1 className="font-semibold text-gray-900">Algo salió mal</h1>
          <p className="text-sm text-gray-500">{message}</p>
        </div>
      </div>
    )
  })
}
