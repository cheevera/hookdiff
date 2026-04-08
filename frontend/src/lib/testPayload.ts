function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

export function buildTestPayload(): object {
  const statuses = ['succeeded', 'pending', 'failed'] as const
  const events = ['payment_intent.succeeded', 'payment_intent.created', 'charge.updated'] as const
  const amounts = [1999, 2499, 4900, 9900, 14999]

  return {
    id: `evt_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
    type: randomItem([...events]),
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `pi_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
        amount: randomItem(amounts),
        currency: 'usd',
        status: randomItem([...statuses]),
        customer: 'cus_R8k2xL9mNvQ4',
        metadata: {
          order_id: `order_${Math.floor(Math.random() * 9000) + 1000}`,
        },
      },
    },
  }
}
