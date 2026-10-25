import { test, expect } from '@playwright/test'
import { credentials, m109 } from '../fixtures/meters'

/**
 * Suma puntos: API con request de Playwright.
 * Evidencia DEF-02 (case) y oráculo M-109.
 */
test.describe('API meter/getAll', () => {
  let token: string

  test.beforeAll(async ({ request }) => {
    const res = await request.post('http://127.0.0.1:8080/api/v1/auth/login', {
      data: { email: credentials.email, password: credentials.password },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    token = body.access_token
  })

  test('109 encuentra M-109 CRITICAL', async ({ request }) => {
    const res = await request.post('http://127.0.0.1:8080/api/v1/meter/getAll', {
      headers: { Authorization: `Bearer ${token}` },
      data: { filter: { meter_id: '109' } },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.count).toBe(1)
    expect(body.rows[0].meter_id).toBe(m109.id)
    expect(body.rows[0].status).toBe('CRITICAL')
  })

  test('m-109 debería encontrar M-109 (docs case-insensitive)', async ({ request }) => {
    // DEF-02: hoy count=0. test.fail → falla ahora y pasa cuando se corrija.
    test.fail(true, 'DEF-02: búsqueda case-sensitive pese a docs')
    const res = await request.post('http://127.0.0.1:8080/api/v1/meter/getAll', {
      headers: { Authorization: `Bearer ${token}` },
      data: { filter: { meter_id: 'm-109' } },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.count, 'docs: búsqueda sin importar mayúsculas').toBe(1)
  })
})

