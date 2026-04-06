import { useSendTestRequest } from '../hooks/useSendTestRequest'
import { CopyButton } from './CopyButton'
import { ThemeToggle } from './ThemeToggle'

type HeaderProps = {
  url: string
  slug: string
  onNewEndpoint: () => void
}

export function Header({ url, slug, onNewEndpoint }: HeaderProps) {
  const sendTest = useSendTestRequest(slug)

  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hookdiff</span>
      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{url}</span>
      <CopyButton text={url} />
      <button
        type="button"
        onClick={onNewEndpoint}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        New Endpoint
      </button>
      <button
        type="button"
        onClick={() => sendTest.mutate()}
        disabled={sendTest.isPending}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        {sendTest.isPending ? 'Sending...' : 'Send test'}
      </button>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
