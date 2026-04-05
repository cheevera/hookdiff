import { HARDCODED_ENDPOINT_URL } from '../fixtures/requests'
import { CopyButton } from './CopyButton'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hookdiff</span>
      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
        {HARDCODED_ENDPOINT_URL}
      </span>
      <CopyButton text={HARDCODED_ENDPOINT_URL} />
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  )
}
