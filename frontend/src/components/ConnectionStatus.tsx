import * as env from '../lib/env'

type Props = { status: 'connecting' | 'open' | 'closed' }

export function ConnectionStatus({ status }: Props) {
  if (!env.isDev()) return null
  const label =
    status === 'open' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Disconnected'
  const dotClass =
    status === 'open' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="fixed bottom-2 left-2 flex items-center gap-2 rounded bg-gray-800/80 px-2 py-1 text-xs text-gray-100">
      <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </div>
  )
}
