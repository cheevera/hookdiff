import type { WebhookRequest } from '../types/request'

export const MOCK_REQUESTS: WebhookRequest[] = [
  {
    id: 'req_01',
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
      'stripe-signature': 't=1712328000,v1=abc123',
    },
    body: {
      id: 'evt_1PqX2z2eZvKYlo2C8Jd9xYzA',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_3PqX2z2eZvKYlo2C1K5Xl0vY',
          amount: 2499,
          currency: 'usd',
          status: 'succeeded',
        },
      },
    },
    queryParams: {},
    receivedAt: '2026-04-05T14:32:11.482Z',
  },
  {
    id: 'req_02',
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.42',
    },
    body: {
      userId: 918,
      profile: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        plan: 'pro',
      },
      updatedAt: '2026-04-05T14:29:00Z',
    },
    queryParams: { source: 'dashboard' },
    receivedAt: '2026-04-05T14:29:03.117Z',
  },
  {
    id: 'req_03',
    method: 'GET',
    headers: {
      accept: 'application/json',
      'user-agent': 'curl/8.4.0',
    },
    body: null,
    queryParams: { ping: '1' },
    receivedAt: '2026-04-05T14:27:45.902Z',
  },
]
