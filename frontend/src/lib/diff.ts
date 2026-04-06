export type DiffType = 'changed' | 'added' | 'removed'

export type DiffEntry = {
  path: string
  type: DiffType
  oldValue: unknown
  newValue: unknown
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

export function diff(a: Record<string, unknown>, b: Record<string, unknown>): DiffEntry[] {
  const entries: DiffEntry[] = []
  walk(a, b, '', entries)
  return entries
}

function walk(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  prefix: string,
  entries: DiffEntry[],
): void {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key
    const inA = key in a
    const inB = key in b

    if (inB && !inA) {
      entries.push({ path, type: 'added', oldValue: undefined, newValue: b[key] })
      continue
    }

    if (inA && !inB) {
      entries.push({ path, type: 'removed', oldValue: a[key], newValue: undefined })
      continue
    }

    const valA = a[key]
    const valB = b[key]

    if (isPlainObject(valA) && isPlainObject(valB)) {
      walk(valA, valB, path, entries)
      continue
    }

    if (JSON.stringify(valA) !== JSON.stringify(valB)) {
      entries.push({ path, type: 'changed', oldValue: valA, newValue: valB })
    }
  }
}
