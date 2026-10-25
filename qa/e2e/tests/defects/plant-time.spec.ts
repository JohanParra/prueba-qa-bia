import { test, expect } from '@playwright/test'
import { m109 } from '../fixtures/meters'

/**
 * DEF-01: formatPlantTime usa getters locales.
 * Con timezoneId America/Bogota (config), 14:00Z se pinta como 09:00.
 *
 * test.fail(): debe fallar hoy; pasará cuando formatPlantTime use getUTC*.
 * Esperado de negocio: "12/09 14:00" (PRODUCT.md / reason del motor).
 */
test.describe('DEF-01 hora de planta', () => {
  test.fail(true, 'DEF-01: formatPlantTime convierte a zona del navegador; debe mostrar 14:00 de planta')

  test('Despacho muestra Detectada 12/09 14:00 para M-109', async ({ page }) => {
    await page.goto('/')

    const lead = page.getByRole('article').filter({ hasText: m109.id }).first()
    await expect(lead).toBeVisible()
    // Contrato PRODUCT.md: hora de planta sin conversión (14:00Z → 14:00).
    await expect(lead.getByText(`Detectada ${m109.detectedPlantTime}`)).toBeVisible()
  })
})
