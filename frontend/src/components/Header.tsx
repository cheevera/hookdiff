import { HARDCODED_ENDPOINT_URL } from '../fixtures/requests'
import { CopyButton } from './CopyButton'

export function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
      <span className="text-sm font-semibold">Hookdiff</span>
      <span className="font-mono text-sm text-gray-700">{HARDCODED_ENDPOINT_URL}</span>
      <CopyButton text={HARDCODED_ENDPOINT_URL} />
    </header>
  )
}
