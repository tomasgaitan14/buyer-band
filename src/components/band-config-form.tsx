'use client'

import { useState, useEffect } from 'react'
import type { BarConfig, Message } from '@/types/widget'
import { TRANSITIONS, TRANSITION_CSS, TRANSITION_ANIMATION } from '@/types/widget'

interface Props {
  storeId: number
  storeUrl: string
  plan: string
  trialDaysLeft: number | null
  initialConfig: BarConfig
  initialEnabled: boolean
}

export function BandConfigForm({
  storeUrl,
  plan,
  trialDaysLeft,
  initialConfig,
  initialEnabled,
}: Props) {
  const [config, setConfig] = useState<BarConfig>(initialConfig)
  const [enabled, setEnabled] = useState(initialEnabled)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)

  const [previewIndex, setPreviewIndex] = useState(0)

  useEffect(() => {
    setPreviewIndex(0)
    if (config.messages.length <= 1) return
    const interval = setInterval(() => {
      setPreviewIndex((i) => (i + 1) % config.messages.length)
    }, config.speed)
    return () => clearInterval(interval)
  }, [config.speed, config.messages.length])

  const previewMsg = config.messages[previewIndex] ?? { text: '', link: '' }
  const previewAnimation = TRANSITION_ANIMATION[config.transition ?? 'none']

  function updateMessage(index: number, field: keyof Message, value: string) {
    setConfig((prev) => {
      const msgs = [...prev.messages]
      msgs[index] = { ...msgs[index], [field]: value }
      return { ...prev, messages: msgs }
    })
  }

  function addMessage() {
    if (config.messages.length >= 5) return
    setConfig((prev) => ({ ...prev, messages: [...prev.messages, { text: '', link: '' }] }))
  }

  function removeMessage(index: number) {
    if (config.messages.length <= 1) return
    setConfig((prev) => ({ ...prev, messages: prev.messages.filter((_, i) => i !== index) }))
  }

  function isValidUrl(value: string): boolean {
    if (!value) return true
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  async function handleSave() {
    const invalidLink = config.messages.find((m) => m.link && !isValidUrl(m.link))
    if (invalidLink) {
      setFeedback('error')
      setTimeout(() => setFeedback(null), 3000)
      return
    }
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, enabled }),
      })
      setFeedback(res.ok ? 'saved' : 'error')
    } catch {
      setFeedback('error')
    } finally {
      setSaving(false)
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <style>{TRANSITION_CSS}</style>
      {/* Plan badge */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Barra de anuncio</h1>
          <p className="text-sm text-gray-500">{storeUrl}</p>
        </div>
        {plan === 'trial' && trialDaysLeft !== null && (
          <span className="text-xs font-medium bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
            Trial · {trialDaysLeft} días restantes
          </span>
        )}
        {plan === 'active' && (
          <span className="text-xs font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
            Activo
          </span>
        )}
      </div>

      {/* Preview */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Preview</p>
        <div className="-mx-6 overflow-hidden border border-gray-200">
          {/* barra */}
          <div
            className="relative flex items-center justify-center px-12 py-3 text-sm min-h-[44px]"
            style={{ backgroundColor: config.backgroundColor, color: config.textColor }}
          >
            {previewMsg.link ? (
              <span
                key={previewIndex}
                className="underline"
                style={{ animation: previewAnimation }}
              >
                {previewMsg.text || 'Escribí tu mensaje...'}
              </span>
            ) : (
              <span
                key={previewIndex}
                style={{ animation: previewAnimation }}
              >
                {previewMsg.text || 'Escribí tu mensaje...'}
              </span>
            )}
            {config.closeable && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl leading-none opacity-70 select-none">
                ×
              </span>
            )}
          </div>
          {/* contenido simulado de la tienda */}
          <div className="bg-gray-50 px-6 py-5 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-2 bg-gray-100 rounded w-2/3" />
            <div className="h-2 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-gray-900">Mensajes</h2>
          {config.messages.length < 5 && (
            <button
              onClick={addMessage}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Agregar
            </button>
          )}
        </div>

        <div className="space-y-3">
          {config.messages.map((msg, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Texto del mensaje"
                  value={msg.text}
                  onChange={(e) => updateMessage(i, 'text', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  type="url"
                  placeholder="Link (opcional, ej: https://mitienda.com/sale)"
                  value={msg.link}
                  onChange={(e) => updateMessage(i, 'link', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                    msg.link && !isValidUrl(msg.link)
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-black'
                  }`}
                />
                {msg.link && !isValidUrl(msg.link) && (
                  <p className="text-xs text-red-500">Debe ser una URL válida (https://...)</p>
                )}
              </div>
              {config.messages.length > 1 && (
                <button
                  onClick={() => removeMessage(i)}
                  className="mt-2 text-gray-400 hover:text-red-500 text-lg leading-none"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Colores y opciones */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <h2 className="font-medium text-gray-900">Apariencia</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm text-gray-600">Color de fondo</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => setConfig((p) => ({ ...p, backgroundColor: e.target.value }))}
                className="h-9 w-14 rounded border border-gray-200 cursor-pointer"
              />
              <span className="text-sm text-gray-500 font-mono">{config.backgroundColor}</span>
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-600">Color de texto</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.textColor}
                onChange={(e) => setConfig((p) => ({ ...p, textColor: e.target.value }))}
                className="h-9 w-14 rounded border border-gray-200 cursor-pointer"
              />
              <span className="text-sm text-gray-500 font-mono">{config.textColor}</span>
            </div>
          </label>
        </div>

        <label className="block space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Velocidad de rotación</span>
            <span className="text-sm text-gray-500">{(config.speed / 1000).toFixed(1)}s</span>
          </div>
          <input
            type="range"
            min={1000}
            max={6000}
            step={500}
            value={config.speed}
            onChange={(e) => setConfig((p) => ({ ...p, speed: parseInt(e.target.value) }))}
            className="w-full accent-black"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1s</span>
            <span>6s</span>
          </div>
        </label>

        <div className="space-y-2">
          <span className="text-sm text-gray-600">Transición entre mensajes</span>
          <div className="flex gap-2 flex-wrap">
            {TRANSITIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setConfig((p) => ({ ...p, transition: t.value }))}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  config.transition === t.value
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Botón de cierre</p>
            <p className="text-xs text-gray-400">El visitante puede cerrar la barra</p>
          </div>
          <button
            role="switch"
            aria-checked={config.closeable}
            onClick={() => setConfig((p) => ({ ...p, closeable: !p.closeable }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.closeable ? 'bg-black' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.closeable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Widget activo */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Widget activo</p>
          <p className="text-xs text-gray-400">Mostrar la barra en tu tienda</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((p) => !p)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-black' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {feedback === 'saved' && (
          <span className="text-sm text-green-600 font-medium">Cambios guardados</span>
        )}
        {feedback === 'error' && (
          <span className="text-sm text-red-600 font-medium">
            {config.messages.some((m) => m.link && !isValidUrl(m.link))
              ? 'Corregí los links inválidos antes de guardar'
              : 'Error al guardar'}
          </span>
        )}
      </div>
    </div>
  )
}
