import { useEffect } from 'react'
import { X } from 'lucide-react'

interface PhotoLightboxProps {
  src: string | null
  caption: string
  onClose: () => void
}

/** Foto em tela cheia, com fundo escuro. Fecha no X, no Esc ou clicando fora. */
export default function PhotoLightbox({ src, caption, onClose }: PhotoLightboxProps) {
  useEffect(() => {
    if (!src) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      className="fixed inset-0 z-80 flex animate-fade-in flex-col items-center justify-center gap-3 bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar foto"
        className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={caption}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[80dvh] max-w-full rounded-lg object-contain shadow-2xl"
      />
      <p className="max-w-full truncate px-4 text-center text-sm font-medium text-white">{caption}</p>
    </div>
  )
}
