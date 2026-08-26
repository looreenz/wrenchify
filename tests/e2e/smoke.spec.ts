import { test, expect, _electron as electron } from '@playwright/test'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join, resolve } from 'path'

const repoRoot = resolve(__dirname, '../..')

function makeUserDataDir(): string {
  return mkdtempSync(join(tmpdir(), 'wrenchify-e2e-'))
}

function baseUrl(pageUrl: string): string {
  return pageUrl.split('#')[0]
}

test('critical business flow: customer → vehicle → quote → work order → payment', async () => {
  const userDataDir = makeUserDataDir()
  const electronApp = await electron.launch({
    args: [repoRoot, `--user-data-dir=${userDataDir}`],
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  })

  const page = await electronApp.firstWindow()
  await expect(page).toHaveTitle('Wrenchify')

  const appBase = baseUrl(page.url())

  // Create customer
  await page.goto(`${appBase}#/customers/new`)
  await page.locator('[data-testid="customer-first-name"]').fill('Mario')
  await page.locator('[data-testid="customer-last-name"]').fill('Rossi')
  await page.getByRole('button', { name: 'Salva' }).click()
  await page.waitForURL(/#\/customers$/)
  await expect(page.getByText('Rossi')).toBeVisible()

  // Create vehicle for customer 1
  await page.goto(`${appBase}#/vehicles/new?customerId=1`)
  await page.locator('[data-testid="vehicle-license-plate"]').fill('AA123BB')
  await page.locator('[data-testid="vehicle-make"]').fill('Fiat')
  await page.locator('[data-testid="vehicle-model"]').fill('Panda')
  await page.getByRole('button', { name: 'Salva' }).click()
  await page.waitForURL(/#\/vehicles$/)
  await expect(page.getByText('AA123BB')).toBeVisible()

  // Create quote for vehicle 1
  await page.goto(`${appBase}#/quotes/new?customerId=1&vehicleId=1`)
  await page.locator('[data-testid="quote-labor-hours"]').fill('2')
  await page.locator('[data-testid="quote-hourly-rate"]').fill('50')
  await page.locator('[data-testid="quote-parts-cost"]').fill('30')
  await page.getByRole('button', { name: 'Salva' }).click()
  await page.waitForURL(/#\/quotes$/)
  await expect(page.getByText('130,00 €')).toBeVisible()

  // Open quote detail, accept and convert
  await page.locator('.quote-table .row-actions button').first().click()
  await page.getByTestId('quote-accept').click()
  await page.getByTestId('quote-convert').click()
  await page.waitForURL(/#\/work-orders\/\d+\/edit$/)
  await expect(page.getByText('130,00 €').first()).toBeVisible()

  // Add payment to mark work order as paid
  await page.getByTestId('payment-add').click()
  await page.locator('[data-testid="payment-amount"]').fill('130')
  await page.getByTestId('payment-save').click()
  await expect(page.getByText('Pagato')).toBeVisible()

  // Verify persistence in work order list
  await page.goto(`${appBase}#/work-orders`)
  await page.locator('.work-order-table').waitFor()
  await expect(page.getByText('Pagato')).toBeVisible()

  await electronApp.close()
})
