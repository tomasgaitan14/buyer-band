export interface Message {
  text: string
  link: string
}

export type Transition = 'none' | 'fade' | 'slide-up' | 'slide-down'

export interface BarConfig {
  messages: Message[]
  backgroundColor: string
  textColor: string
  speed: number
  closeable: boolean
  transition: Transition
}

export const DEFAULT_CONFIG: BarConfig = {
  messages: [{ text: 'Bienvenido a nuestra tienda 🎉', link: '' }],
  backgroundColor: '#000000',
  textColor: '#ffffff',
  speed: 3500,
  closeable: true,
  transition: 'fade',
}

export const TRANSITIONS: { value: Transition; label: string }[] = [
  { value: 'none', label: 'Ninguna' },
  { value: 'fade', label: 'Difuminado' },
  { value: 'slide-up', label: 'Slide ↑' },
  { value: 'slide-down', label: 'Slide ↓' },
]

export const TRANSITION_CSS = `
  @keyframes bbFade {
    from { opacity: 0 }
    to { opacity: 1 }
  }
  @keyframes bbSlideUp {
    from { opacity: 0; transform: translateY(6px) }
    to { opacity: 1; transform: translateY(0) }
  }
  @keyframes bbSlideDown {
    from { opacity: 0; transform: translateY(-6px) }
    to { opacity: 1; transform: translateY(0) }
  }
`

export const TRANSITION_ANIMATION: Record<Transition, string> = {
  none: '',
  fade: 'bbFade 0.4s ease',
  'slide-up': 'bbSlideUp 0.4s ease',
  'slide-down': 'bbSlideDown 0.4s ease',
}
