import { test, expect } from '@playwright/test'

test.describe('Home', () => {
  test('should redirect to dashboard', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: 'Your Projects' })).toBeVisible()
  })
})
