import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { useTheme } from '@/hooks/useTheme'

beforeEach(() => {
  document.documentElement.classList.remove('dark')
  localStorage.clear()
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
  localStorage.clear()
  vi.restoreAllMocks()
})

test('default theme reflects the class on the html element', () => {
  document.documentElement.classList.add('dark')
  const { result } = renderHook(() => useTheme())
  expect(result.current.theme).toBe('dark')
})

test('setTheme("dark") adds the dark class and writes localStorage', () => {
  const { result } = renderHook(() => useTheme())
  act(() => {
    result.current.setTheme('dark')
  })
  expect(document.documentElement.classList.contains('dark')).toBe(true)
  expect(localStorage.getItem('hookdiff-theme')).toBe('dark')
})

test('setTheme("light") removes the dark class and writes localStorage', () => {
  document.documentElement.classList.add('dark')
  const { result } = renderHook(() => useTheme())
  act(() => {
    result.current.setTheme('light')
  })
  expect(document.documentElement.classList.contains('dark')).toBe(false)
  expect(localStorage.getItem('hookdiff-theme')).toBe('light')
})

test('swallows errors when localStorage.setItem throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(() => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.toggle()
    })
  }).not.toThrow()
})
