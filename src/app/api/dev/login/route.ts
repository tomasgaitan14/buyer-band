import { NextRequest, NextResponse } from 'next/server'
import { sessionCookieOptions } from '@/lib/session'

// Solo disponible en desarrollo — 404 en producción
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response('Not found', { status: 404 })
  }

  const storeId = parseInt(request.nextUrl.searchParams.get('store_id') ?? '', 10)
  if (!storeId) return new Response('Falta store_id', { status: 400 })

  const response = NextResponse.redirect(new URL('/dashboard', request.url))
  response.cookies.set(sessionCookieOptions(storeId))
  return response
}
