import type { ReactNode } from 'react'

export default function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 lg:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-gray-600 lg:text-base">{description}</p>
      </div>
      {action}
    </div>
  )
}
