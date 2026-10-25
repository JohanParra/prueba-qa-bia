import type { Page } from '@playwright/test'
import { credentials } from '../tests/fixtures/meters'

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(email = credentials.email, password = credentials.password) {
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Contraseña').fill(password)
    await this.page.getByRole('button', { name: /Entrar/i }).click()
  }
}
