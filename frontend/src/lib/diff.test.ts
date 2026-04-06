import { describe, expect, test } from 'vitest'
import { diff } from './diff'

describe('diff', () => {
  test('changed scalar', () => {
    const result = diff({ name: 'Alice' }, { name: 'Bob' })
    expect(result).toEqual([{ path: 'name', type: 'changed', oldValue: 'Alice', newValue: 'Bob' }])
  })

  test('added field', () => {
    const result = diff({}, { color: 'red' })
    expect(result).toEqual([{ path: 'color', type: 'added', oldValue: undefined, newValue: 'red' }])
  })

  test('removed field', () => {
    const result = diff({ color: 'red' }, {})
    expect(result).toEqual([
      { path: 'color', type: 'removed', oldValue: 'red', newValue: undefined },
    ])
  })

  test('deeply nested path', () => {
    const a = { data: { object: { amount: 100 } } }
    const b = { data: { object: { amount: 200 } } }
    const result = diff(a, b)
    expect(result).toEqual([
      { path: 'data.object.amount', type: 'changed', oldValue: 100, newValue: 200 },
    ])
  })

  test('array atomicity: changed array compared as a whole', () => {
    const result = diff({ items: [1, 2, 3] }, { items: [1, 2, 4] })
    expect(result).toEqual([
      { path: 'items', type: 'changed', oldValue: [1, 2, 3], newValue: [1, 2, 4] },
    ])
  })

  test('array atomicity: identical arrays produce no diff', () => {
    const result = diff({ items: [1, 2] }, { items: [1, 2] })
    expect(result).toEqual([])
  })

  test('both empty objects', () => {
    expect(diff({}, {})).toEqual([])
  })

  test('one empty: a is empty', () => {
    const result = diff({}, { x: 1, y: 2 })
    expect(result).toEqual([
      { path: 'x', type: 'added', oldValue: undefined, newValue: 1 },
      { path: 'y', type: 'added', oldValue: undefined, newValue: 2 },
    ])
  })

  test('one empty: b is empty', () => {
    const result = diff({ x: 1, y: 2 }, {})
    expect(result).toEqual([
      { path: 'x', type: 'removed', oldValue: 1, newValue: undefined },
      { path: 'y', type: 'removed', oldValue: 2, newValue: undefined },
    ])
  })

  test('identical objects produce no diff', () => {
    const obj = { a: 1, b: { c: 'hello' } }
    expect(diff(obj, obj)).toEqual([])
  })

  test('mixed operations', () => {
    const a = { keep: 'same', change: 'old', remove: 'gone' }
    const b = { keep: 'same', change: 'new', add: 'fresh' }
    const result = diff(a, b)
    expect(result).toEqual([
      { path: 'change', type: 'changed', oldValue: 'old', newValue: 'new' },
      { path: 'remove', type: 'removed', oldValue: 'gone', newValue: undefined },
      { path: 'add', type: 'added', oldValue: undefined, newValue: 'fresh' },
    ])
  })

  test('null values: null to value', () => {
    const result = diff({ x: null }, { x: 42 })
    expect(result).toEqual([{ path: 'x', type: 'changed', oldValue: null, newValue: 42 }])
  })

  test('null values: value to null', () => {
    const result = diff({ x: 42 }, { x: null })
    expect(result).toEqual([{ path: 'x', type: 'changed', oldValue: 42, newValue: null }])
  })

  test('null values: null to null is no diff', () => {
    expect(diff({ x: null }, { x: null })).toEqual([])
  })

  test('object to scalar transition', () => {
    const result = diff({ x: { nested: 1 } }, { x: 'flat' })
    expect(result).toEqual([
      { path: 'x', type: 'changed', oldValue: { nested: 1 }, newValue: 'flat' },
    ])
  })

  test('scalar to object transition', () => {
    const result = diff({ x: 'flat' }, { x: { nested: 1 } })
    expect(result).toEqual([
      { path: 'x', type: 'changed', oldValue: 'flat', newValue: { nested: 1 } },
    ])
  })

  test('array to object transition', () => {
    const result = diff({ x: [1, 2] }, { x: { a: 1 } })
    expect(result).toEqual([{ path: 'x', type: 'changed', oldValue: [1, 2], newValue: { a: 1 } }])
  })

  test('added field with nested object is not recursed into', () => {
    const result = diff({}, { x: { deep: { value: 1 } } })
    expect(result).toEqual([
      { path: 'x', type: 'added', oldValue: undefined, newValue: { deep: { value: 1 } } },
    ])
  })

  test('removed field with nested object is not recursed into', () => {
    const result = diff({ x: { deep: { value: 1 } } }, {})
    expect(result).toEqual([
      { path: 'x', type: 'removed', oldValue: { deep: { value: 1 } }, newValue: undefined },
    ])
  })
})
