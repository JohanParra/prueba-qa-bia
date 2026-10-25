import { defineConfig, devices } from '@playwright/test'

/**
 * Prerrequisito: app levantada (frontend :5173 o Docker :3000, API :8080).
 * Zona America/Bogota = operador real (PRODUCT.md) y reproduce DEF-01.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    timezoneId: 'America/Bogota',
    locale: 'es-CO',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.PW_CHANNEL ?? 'chrome',
      },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Preferir Chrome del sistema si no hay browser de Playwright instalado.
        channel: process.env.PW_CHANNEL ?? 'chrome',
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: /\/(business|defects)\/.*\.spec\.ts/,
    },
    {
      // Solo API: no lanza browser (útil si el sandbox bloquea Chrome).
      name: 'api',
      testMatch: /\/api\/.*\.spec\.ts/,
    },
  ],
})
