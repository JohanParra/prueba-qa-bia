import { test, expect } from '@playwright/test'
import { MetersPage } from '../../pages/MetersPage'
import { MeterDetailPage } from '../../pages/MeterDetailPage'
import { m109 } from '../fixtures/meters'

/**
 * Flujo de negocio: Libro → buscar → detalle M-109 → datos clave del oráculo.
 * Usa storageState (setup); no vuelve a loguear.
 */
test.describe('Libro de medidores → detalle M-109', () => {
  test('filtra, abre M-109 y valida estado, variación y acción', async ({ page }) => {
    const meters = new MetersPage(page)
    const detail = new MeterDetailPage(page)

    await meters.goto()
    await meters.search(m109.search)
    await expect(page.getByRole('link', { name: m109.id })).toBeVisible()
    await meters.openMeter(m109.id)

    await expect(detail.title(m109.id)).toBeVisible()
    await expect(page.getByText(m109.statusLabel)).toBeVisible()
    await expect(page.getByText(m109.consumption)).toBeVisible()
    await expect(page.getByText(m109.variation)).toBeVisible()
    await expect(detail.orderSection()).toBeVisible()
    await expect(page.getByText(m109.action)).toBeVisible()
  })
})
