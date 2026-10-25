import type { Page } from '@playwright/test'

export class MetersPage {
  constructor(private readonly page: Page) {}

  private meterSearch() {
    // getByLabel('Medidor') también matchea aria-label="Buscar medidor" (substring).
    return this.page.getByRole('combobox', { name: 'Medidor' })
  }

  async goto() {
    await this.page.goto('/medidores')
    await this.page.getByRole('heading', { name: 'Libro de medidores' }).waitFor({ state: 'visible' })
    await this.meterSearch().waitFor({ state: 'visible' })
  }

  async search(meterQuery: string) {
    await this.meterSearch().fill(meterQuery)
    await this.page.getByRole('button', { name: 'Buscar medidor' }).click()
  }

  async openMeter(meterId: string) {
    await this.page.getByRole('link', { name: meterId }).first().click()
  }
}
