import { NavLink, Outlet } from 'react-router-dom'
import { CalendarCheck, Computer, History, LogOut, type LucideIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { dueStatus } from '../lib/maintenance'
import logoNm from '../assets/logo-nm.jpeg'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** mostra o contador de manutenções atrasadas */
  showOverdue?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Agenda', icon: CalendarCheck, showOverdue: true },
  { to: '/equipamentos', label: 'Equipamentos', icon: Computer },
  { to: '/historico', label: 'Histórico', icon: History },
]

const HUB_URL = import.meta.env.VITE_HUB_URL

function firstName(name: string | null | undefined) {
  return name?.trim().split(/\s+/)[0] ?? ''
}

export default function Layout() {
  const { user } = useAuth()
  const { equipment } = useData()
  const overdue = equipment.filter((e) => e.active && dueStatus(e.next_date) === 'overdue').length
  const role = user?.isAdmin ? 'Administrador' : 'Técnico'

  return (
    <div className="min-h-dvh bg-gray">
      {/* menu lateral do computador */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-white shadow-card lg:flex">
        <div className="flex justify-center py-6">
          <img src={logoNm} alt="Logo Novamix" className="w-[55%] max-w-32 rounded-lg" />
        </div>

        <div className="mx-4 mb-4 rounded-2xl bg-gray px-3 py-2.5">
          <p className="text-xs font-semibold text-gray-500">{role}</p>
          <p className="truncate text-sm font-extrabold text-gray-900">Olá, {firstName(user?.name) || 'tudo bem?'}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `press flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  isActive ? 'bg-orange-base text-white shadow-sm' : 'text-gray-700 hover:bg-orange-base/10 hover:text-orange-base'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                  <span className="flex-1">{item.label}</span>
                  {item.showOverdue && overdue > 0 && (
                    <span
                      title={`${overdue} atrasada(s)`}
                      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold ${
                        isActive ? 'bg-white text-orange-base' : 'bg-red-base text-white'
                      }`}
                    >
                      {overdue}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3">
          <a
            href={HUB_URL}
            className="press flex items-center justify-center gap-2 rounded-xl bg-red-light px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-base"
          >
            <LogOut className="h-4 w-4" />
            Voltar ao hub
          </a>
        </div>
      </aside>

      {/* topo do celular */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <img src={logoNm} alt="Novamix" className="h-9 w-9 rounded-xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-gray-900">Olá, {firstName(user?.name) || 'tudo bem?'}</p>
            <p className="truncate text-xs text-gray-500">Manutenção preventiva · {role}</p>
          </div>
          <a
            href={HUB_URL}
            aria-label="Voltar ao hub"
            title="Voltar ao hub"
            className="press flex h-9 w-9 items-center justify-center rounded-full text-red-base transition hover:bg-red-base/10"
          >
            <LogOut className="h-5 w-5" />
          </a>
        </div>
      </header>

      <main className="lg:ml-64">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 pb-6 lg:px-8 lg:pt-10">
          <Outlet />
        </div>
        <footer className="px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))] text-center text-xs text-gray-500 lg:pb-6">
          Desenvolvido por{' '}
          <a
            href="https://www.marlonalves.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-600 transition hover:text-orange-base"
          >
            Marlon Alves
          </a>{' '}
          e{' '}
          <a
            href="https://www.mthcode.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-600 transition hover:text-orange-base"
          >
            MTHCODE
          </a>
        </footer>
      </main>

      {/* barra de navegação do celular */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgb(16_24_40/0.06)] backdrop-blur lg:hidden">
        <ul className="mx-auto flex max-w-lg">
          {NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end
                className={({ isActive }) =>
                  `press relative flex flex-col items-center gap-0.5 pt-2.5 pb-2 text-[11px] font-bold transition-colors ${
                    isActive ? 'text-orange-base' : 'text-gray-500'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-orange-base" />}
                    <span className="relative">
                      <item.icon className="h-6 w-6" strokeWidth={isActive ? 2.4 : 1.9} />
                      {item.showOverdue && overdue > 0 && (
                        <span className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-base px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                          {overdue}
                        </span>
                      )}
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
