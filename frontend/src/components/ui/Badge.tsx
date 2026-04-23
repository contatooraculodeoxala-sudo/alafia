interface BadgeProps {
  label: string
  variant?: string
}

const colors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-red-100 text-red-700',
  prospecto: 'bg-yellow-100 text-yellow-700',
  pendente: 'bg-yellow-100 text-yellow-700',
  pago: 'bg-green-100 text-green-700',
  parcial: 'bg-orange-100 text-orange-700',
  cancelado: 'bg-gray-100 text-gray-600',
  em_andamento: 'bg-blue-100 text-blue-700',
  finalizado: 'bg-green-100 text-green-700',
  pausado: 'bg-orange-100 text-orange-700',
  agendado: 'bg-purple-100 text-purple-700',
  realizado: 'bg-green-100 text-green-700',
  nao_compareceu: 'bg-red-100 text-red-700',
  admin: 'bg-red-100 text-red-700',
  atendente: 'bg-blue-100 text-blue-700',
  operacional: 'bg-green-100 text-green-700',
  administrativo: 'bg-yellow-100 text-yellow-700',
  entrada: 'bg-green-100 text-green-700',
  saida: 'bg-red-100 text-red-700',
  ativa: 'bg-green-100 text-green-700',
  encerrada: 'bg-gray-100 text-gray-600',
  instagram: 'bg-pink-100 text-pink-700',
  whatsapp: 'bg-green-100 text-green-700',
  facebook: 'bg-blue-100 text-blue-700',
  direto: 'bg-gray-100 text-gray-600',
  indicacao: 'bg-purple-100 text-purple-700',
}

const labels: Record<string, string> = {
  ativo: 'Ativo', inativo: 'Inativo', prospecto: 'Prospecto',
  pendente: 'Pendente', pago: 'Pago', parcial: 'Parcial', cancelado: 'Cancelado',
  em_andamento: 'Em andamento', finalizado: 'Finalizado', pausado: 'Pausado',
  agendado: 'Agendado', realizado: 'Realizado', nao_compareceu: 'Não compareceu',
  admin: 'Admin', atendente: 'Atendente', operacional: 'Operacional', administrativo: 'Administrativo',
  entrada: 'Entrada', saida: 'Saída', ativa: 'Ativa', encerrada: 'Encerrada',
  instagram: 'Instagram', whatsapp: 'WhatsApp', facebook: 'Facebook',
  direto: 'Direto', indicacao: 'Indicação',
}

export function Badge({ label, variant }: BadgeProps) {
  const key = variant || label
  const cls = colors[key] || 'bg-gray-100 text-gray-600'
  const text = labels[key] || label
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {text}
    </span>
  )
}
