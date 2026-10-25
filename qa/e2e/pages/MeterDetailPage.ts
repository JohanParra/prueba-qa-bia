import type { Page, Locator } from '@playwright/test'

export class MeterDetailPage {
  constructor(private readonly page: Page) {}

  title(meterId: string): Locator {
    return this.page.getByRole('heading', { name: meterId })
  }

  lastPlantReading(): Locator {
    return this.page.getByText(/Última lectura/i)
  }

  orderSection(): Locator {
    return this.page.getByRole('heading', { name: /Orden/i })
  }

  async openInvestigation() {
    await this.page.getByRole('link', { name: /Abrir investigación/i }).click()
  }
}
