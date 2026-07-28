// TN sube el widget a su CDN — la URL de la API va hardcodeada
const __API_BASE__ = 'https://band-lilac.vercel.app'

interface Message {
  text: string
  link?: string
}

type Transition = 'none' | 'fade' | 'slide-up' | 'slide-down'

interface BarConfig {
  messages: Message[]
  backgroundColor: string
  textColor: string
  speed: number
  closeable: boolean
  transition: Transition
}

const TRANSITION_ANIMATION: Record<Transition, string> = {
  none: '',
  fade: 'bbFade 0.4s ease',
  'slide-up': 'bbSlideUp 0.4s ease',
  'slide-down': 'bbSlideDown 0.4s ease',
}

interface WidgetResponse {
  enabled: boolean
  config?: BarConfig
}

;(function () {
  // LS es el objeto global que expone Tiendanube en el storefront
  const LS = (window as any).LS
  const storeId = LS?.store?.id

  if (!storeId) return

  const CACHE_KEY = `bb-cfg-${storeId}`
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  function readCache(): WidgetResponse | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return null
      const { data, ts } = JSON.parse(raw)
      if (Date.now() - ts > CACHE_TTL) return null
      return data as WidgetResponse
    } catch {
      return null
    }
  }

  function writeCache(data: WidgetResponse) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
    } catch {}
  }

  // mostrar desde caché inmediatamente, sin esperar al fetch
  const cached = readCache()
  if (cached?.enabled && cached.config) {
    render(cached.config)
  }

  // refrescar en background — si hay cambios se aplican en la próxima carga
  fetch(`${__API_BASE__}/api/widget-config?store_id=${storeId}`)
    .then((r) => r.json() as Promise<WidgetResponse>)
    .then((data) => {
      writeCache(data)
      // si no había caché, renderizar ahora
      if (!cached) {
        if (!data?.enabled || !data.config) return
        render(data.config)
      }
    })
    .catch(() => {}) // silenciar errores — nunca interrumpir la tienda del comerciante

  function render(config: BarConfig) {
    const {
      messages = [],
      backgroundColor = '#000000',
      textColor = '#ffffff',
      speed = 3500,
      closeable = true,
      transition = 'none',
    } = config

    // inyectar CSS de animaciones una sola vez
    if (!document.getElementById('bb-styles')) {
      const style = document.createElement('style')
      style.id = 'bb-styles'
      style.textContent = `
        @keyframes bbFade { from { opacity:0 } to { opacity:1 } }
        @keyframes bbSlideUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bbSlideDown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
      `
      document.head.appendChild(style)
    }

    if (!messages.length) return

    const bar = document.createElement('div')
    bar.id = 'buyer-band'
    Object.assign(bar.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '99999',
      backgroundColor,
      color: textColor,
      textAlign: 'center',
      padding: '10px 48px',
      fontSize: '14px',
      fontFamily: 'inherit',
      lineHeight: '1.4',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '40px',
    })

    const messageEl = document.createElement('span')
    bar.appendChild(messageEl)

    if (closeable) {
      const closeBtn = document.createElement('button')
      Object.assign(closeBtn.style, {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: textColor,
        fontSize: '20px',
        lineHeight: '1',
        padding: '0',
        opacity: '0.7',
      })
      closeBtn.textContent = '×'
      closeBtn.setAttribute('aria-label', 'Cerrar')
      closeBtn.addEventListener('click', () => {
        bar.remove()
        document.body.style.paddingTop = prev
      })
      bar.appendChild(closeBtn)
    }

    document.body.prepend(bar)
    const prev = document.body.style.paddingTop
    document.body.style.paddingTop = bar.offsetHeight + 'px'

    let index = 0

    function isValidLink(url: string): boolean {
      try {
        const u = new URL(url)
        return u.protocol === 'http:' || u.protocol === 'https:'
      } catch {
        return false
      }
    }

    function showMessage(i: number) {
      const msg = messages[i]
      if (msg.link && isValidLink(msg.link)) {
        messageEl.innerHTML = `<a href="${msg.link}" style="color:${textColor};text-decoration:underline;">${msg.text}</a>`
      } else {
        messageEl.textContent = msg.text
      }
      // re-disparar la animación
      const anim = TRANSITION_ANIMATION[transition]
      if (anim) {
        messageEl.style.animation = 'none'
        void messageEl.offsetHeight // reflow para resetear
        messageEl.style.animation = anim
      }
    }

    showMessage(0)

    if (messages.length > 1) {
      setInterval(() => {
        index = (index + 1) % messages.length
        showMessage(index)
      }, speed)
    }
  }
})()
