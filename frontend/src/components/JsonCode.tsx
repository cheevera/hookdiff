import { useEffect, useState } from 'react'
import type { Theme } from '@/hooks/useTheme'
import { getHighlighter } from '@/lib/shiki'

export function JsonCode({ value, theme }: { value: unknown; theme: Theme }) {
  const [html, setHtml] = useState<string | null>(null)
  const source = JSON.stringify(value, null, 2) ?? 'null'

  useEffect(() => {
    let cancelled = false
    getHighlighter().then((highlighter) => {
      if (cancelled) return
      const rendered = highlighter.codeToHtml(source, {
        lang: 'json',
        theme: theme === 'dark' ? 'github-dark' : 'github-light',
      })
      setHtml(rendered)
    })
    return () => {
      cancelled = true
    }
  }, [source, theme])

  if (html === null) {
    return (
      <pre className="mt-2 overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
        {source}
      </pre>
    )
  }
  return (
    <div
      className="mt-2 overflow-x-auto rounded border border-gray-200 text-xs dark:border-gray-800 [&_pre]:!m-0 [&_pre]:!p-3"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output is trusted
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
