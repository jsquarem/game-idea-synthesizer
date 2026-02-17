import { test, expect } from '@playwright/test'

test.describe('Project creation', () => {
  test('should create a new project and show overview', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: 'New Project' }).click()
    await expect(page).toHaveURL(/\/projects\/new/)

    await page.getByLabel(/name/i).fill('E2E Test Project')
    await page.getByLabel(/description/i).fill('Created by E2E test')
    await page.getByRole('button', { name: 'Create Project' }).click()

    await expect(page).toHaveURL(/\/projects\/[^/]+\/overview/)
    await expect(page.getByRole('heading', { name: 'E2E Test Project' })).toBeVisible()
    await expect(page.getByText('Quick stats')).toBeVisible()
  })
})
