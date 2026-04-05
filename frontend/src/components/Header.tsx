import { CopyButton } from './CopyButton'
import { ThemeToggle } from './ThemeToggle'

type HeaderProps = {
  url: string
  onNewEndpoint: () => void
}

export function Header({ url, onNewEndpoint }: HeaderProps) {
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
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
