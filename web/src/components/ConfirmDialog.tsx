import { TriangleAlert } from 'lucide-react'
import { btnDanger, btnSecondary } from '../lib/ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Pergunta "tem certeza?" antes de apagar alguma coisa. */
export default function ConfirmDialog({ open, title, message, confirmLabel, loading = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-60 flex animate-fade-in items-end justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={() => !loading && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm animate-scale-in rounded-3xl bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-float sm:pb-6"
      >
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-base/10 text-red-base">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
        <p className="mt-1.5 text-sm text-gray-600">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={loading} className={btnSecondary}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={btnDanger}>
            {loading ? 'Aguarde...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
