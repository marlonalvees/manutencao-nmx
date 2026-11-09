import { createElement } from 'react'
import { typeIcon } from '../lib/maintenance'

export default function TypeIcon({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' }) {
  const box = size === 'md' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-lg'

  return (
    <span className={`flex shrink-0 items-center justify-center bg-blue-base text-white ${box}`}>
      {createElement(typeIcon(type), { className: size === 'md' ? 'h-5 w-5' : 'h-4 w-4' })}
    </span>
  )
}
