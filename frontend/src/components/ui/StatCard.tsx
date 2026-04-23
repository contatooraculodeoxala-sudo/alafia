import { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: string
  onClick?: () => void
}

export function StatCard({ title, value, sub, icon: Icon, color = 'red', onClick }: Props) {
  const colors: Record<string, { bg: string; icon: string; text: string }> = {
    red:    { bg: 'bg-red-50',    icon: 'text-red-600',    text: 'text-red-600' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   text: 'text-blue-600' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-600' },
  }
  const c = colors[color] || colors.red

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-lg ${c.bg}`}>
          <Icon size={22} className={c.icon} />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600 mt-0.5">{title}</p>
        {sub && <p className={`text-xs mt-1 ${c.text}`}>{sub}</p>}
      </div>
    </div>
  )
}
