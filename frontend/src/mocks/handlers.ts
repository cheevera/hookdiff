import { type HttpHandler, HttpResponse, http } from 'msw'
import { MOCK_REQUESTS } from './fixtures'

export function generateSlug(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}

export const handlers: HttpHandler[] = [
  http.post('/api/endpoints/', () => {
    const slug = generateSlug()
    return HttpResponse.json({
      slug,
      url: `http://localhost:8000/hooks/${slug}/`,
      createdAt: new Date().toISOString(),
    })
  }),
  http.get('/api/endpoints/:slug/requests/', () => HttpResponse.json(MOCK_REQUESTS)),
]
