import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CircleCheck, TriangleAlert } from 'lucide-react'

type Tone = 'success' | 'error'

interface Toast {
  id: number
  message: string
  tone: Tone
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | undefined>(undefined)

/** Aviso rápido que aparece embaixo e some sozinho (ex.: "Manutenção registrada"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const showToast = useCallback((message: string, tone: Tone = 'success') => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-70 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex max-w-md animate-scale-in items-center gap-2.5 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-float"
          >
            {toast.tone === 'success' ? (
              <CircleCheck className="h-5 w-5 shrink-0 text-green-base" />
            ) : (
              <TriangleAlert className="h-5 w-5 shrink-0 text-red-light" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider')
  return ctx
}
