import { expect, test } from 'vitest'
import { isDev } from './env'

test('isDev returns a boolean', () => {
  expect(typeof isDev()).toBe('boolean')
})
