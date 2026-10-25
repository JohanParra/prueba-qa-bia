import type { Page, Locator } from '@playwright/test'

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  /** Ticket de prioridad 1 (M-109). */
  priorityOneTicket(): Locator {
    return this.page.getByText(/Detectada/i).first()
  }

  meterInOrders(meterId: string): Locator {
    return this.page.getByRole('link', { name: meterId }).first()
  }
}
