export function isDev(): boolean {
  return import.meta.env.DEV
}

export function getWebhookUrl(slug: string): string {
  return `${window.location.origin}/hooks/${slug}/`
}

export function getWebSocketUrl(slug: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/endpoints/${slug}/`
}
