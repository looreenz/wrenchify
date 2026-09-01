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

test.describe('dashboard landing page', () => {
  test('app lands on /dashboard by default', async () => {
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
    await page.waitForURL(/#\/dashboard$/)

    await electronApp.close()
  })

  test('KPI cards render', async () => {
    const userDataDir = makeUserDataDir()
    const electronApp = await electron.launch({
      args: [repoRoot, `--user-data-dir=${userDataDir}`],
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    })

    const page = await electronApp.firstWindow()
    await page.waitForURL(/#\/dashboard$/)

    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.locator('.kpi-card')).toHaveCount(4)

    await electronApp.close()
  })

  test('date range filter is visible', async () => {
    const userDataDir = makeUserDataDir()
    const electronApp = await electron.launch({
      args: [repoRoot, `--user-data-dir=${userDataDir}`],
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    })

    const page = await electronApp.firstWindow()
    await page.waitForURL(/#\/dashboard$/)

    await expect(page.locator('.n-date-picker')).toBeVisible()

    await electronApp.close()
  })

  test('navigation sidebar shows Dashboard as active', async () => {
    const userDataDir = makeUserDataDir()
    const electronApp = await electron.launch({
      args: [repoRoot, `--user-data-dir=${userDataDir}`],
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    })

    const page = await electronApp.firstWindow()
    await page.waitForURL(/#\/dashboard$/)

    const dashboardMenuItem = page.locator('.n-menu-item', { hasText: 'Dashboard' })
    await expect(dashboardMenuItem).toBeVisible()
    await expect(dashboardMenuItem).toHaveClass(/n-menu-item--selected/)

    await electronApp.close()
  })
})
