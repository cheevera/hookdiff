import { afterEach, expect, test, vi } from 'vitest'
import { getWebhookUrl, getWebSocketUrl, isDev } from '@/lib/env'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('isDev returns a boolean', () => {
  expect(typeof isDev()).toBe('boolean')
})

test('getWebhookUrl builds URL from window.location.origin', () => {
  expect(getWebhookUrl('abc123')).toBe(`${window.location.origin}/hooks/abc123/`)
})

test('getWebSocketUrl uses ws: for http: origins', () => {
  expect(getWebSocketUrl('abc123')).toBe(`ws://${window.location.host}/ws/endpoints/abc123/`)
})

test('getWebSocketUrl uses wss: for https: origins', () => {
  vi.stubGlobal('location', { protocol: 'https:', host: 'secure.example.com' })
  expect(getWebSocketUrl('abc123')).toBe('wss://secure.example.com/ws/endpoints/abc123/')
})
