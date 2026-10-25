import { test as setup, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { credentials } from './fixtures/meters'
import path from 'node:path'
import fs from 'node:fs'

const authFile = path.join(__dirname, '../playwright/.auth/user.json')

setup('autenticar y guardar storageState', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true })

  const login = new LoginPage(page)
  await login.goto()
  await login.login(credentials.email, credentials.password)

  // Tras login debe aparecer la navegación principal del shell.
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
  await page.context().storageState({ path: authFile })
})
