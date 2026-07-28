const APP_ID = process.env.TIENDANUBE_APP_ID!
const CLIENT_SECRET = process.env.TIENDANUBE_CLIENT_SECRET!
const TOKEN_URL = 'https://www.tiendanube.com/apps/authorize/token'
const API_BASE = 'https://api.tiendanube.com/v1'

// User-Agent requerido por la API de TN en cada request
const USER_AGENT = `BuyerBand/1.0 (${APP_ID}) tomasagustingaitan@gmail.com`

export interface TokenResponse {
  access_token: string
  token_type: string
  scope: string
  user_id: string // store_id como string
}

export interface StoreInfo {
  id: number
  name: string
  original_domain: string
  main_domain: string
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: APP_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Token exchange failed (${response.status}): ${body}`)
  }

  return response.json()
}

export interface RecurringCharge {
  id: number
  name: string
  price: string
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'cancelled'
  confirmation_url: string
  return_url: string
}

const SUBSCRIPTION_NAME = 'Buyer Band – Plan Mensual'
const SUBSCRIPTION_PRICE = '9.99'

export async function createRecurringCharge(
  storeId: number,
  accessToken: string,
  returnUrl: string
): Promise<RecurringCharge> {
  const response = await fetch(`${API_BASE}/${storeId}/recurring_application_charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authentication: `bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({
      name: SUBSCRIPTION_NAME,
      price: SUBSCRIPTION_PRICE,
      return_url: returnUrl,
    }),
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Create charge failed (${response.status}): ${body}`)
  }
  return response.json()
}

export async function getRecurringCharge(
  storeId: number,
  accessToken: string,
  chargeId: number
): Promise<RecurringCharge> {
  const response = await fetch(`${API_BASE}/${storeId}/recurring_application_charges/${chargeId}`, {
    headers: {
      Authentication: `bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Get charge failed (${response.status}): ${body}`)
  }
  return response.json()
}

export async function activateRecurringCharge(
  storeId: number,
  accessToken: string,
  chargeId: number
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/${storeId}/recurring_application_charges/${chargeId}/activate`,
    {
      method: 'POST',
      headers: {
        Authentication: `bearer ${accessToken}`,
        'User-Agent': USER_AGENT,
      },
    }
  )
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Activate charge failed (${response.status}): ${body}`)
  }
}

export async function getStoreInfo(storeId: number, accessToken: string): Promise<StoreInfo> {
  const response = await fetch(`${API_BASE}/${storeId}`, {
    headers: {
      Authentication: `bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Store info failed (${response.status}): ${body}`)
  }

  return response.json()
}
