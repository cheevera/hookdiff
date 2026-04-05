import { toast } from 'sonner'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  async function onClick() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied!')
    } catch {
      toast.error('Copy failed')
    }
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {label}
    </button>
  )
}
