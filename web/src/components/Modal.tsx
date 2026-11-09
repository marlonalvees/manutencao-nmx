import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { iconButton } from '../lib/ui'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  /** rodapé fixo (botões), fora da área que rola */
  footer?: ReactNode
  wide?: boolean
}

/** Janela centralizada no computador; no celular sobe de baixo, como uma folha. */
export default function Modal({ open, title, subtitle, onClose, children, footer, wide = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full animate-sheet-up flex-col rounded-t-3xl bg-white shadow-float sm:animate-scale-in sm:rounded-3xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
            {subtitle && <p className="truncate text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className={iconButton}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
