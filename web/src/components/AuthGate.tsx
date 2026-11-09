import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { btnPrimary, cardClass } from '../lib/ui'

const HUB_URL = import.meta.env.VITE_HUB_URL

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray p-4">
      <div className={`${cardClass} w-full max-w-sm p-6 text-center`}>
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-base/10 text-orange-base">
          <Lock className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-extrabold text-gray-900">{title}</h1>
        <p className="mt-1.5 text-sm text-gray-600">{text}</p>
        {HUB_URL && (
          <a href={HUB_URL} className={`${btnPrimary} mt-5 w-full`}>
            Voltar ao hub
          </a>
        )}
      </div>
    </div>
  )
}

/** Só mostra o sistema para quem entrou pelo hub e tem o módulo "manutencao" liberado. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, error } = useAuth()

  if (loading) return null

  if (user) return <>{children}</>

  if (error) {
    return <Message title="Acesso não liberado" text={`${error} Peça a liberação para um administrador do hub.`} />
  }

  // sem login: a API já mandou para o hub (lib/api.ts); isso só aparece se o VITE_HUB_URL faltar
  return (
    <Message
      title="Entre pelo hub"
      text="Não encontramos o seu login. Confira VITE_API_URL e VITE_HUB_URL no .env ou use um VITE_DEV_TOKEN em desenvolvimento."
    />
  )
}
