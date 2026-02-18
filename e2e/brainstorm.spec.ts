import { test, expect } from '@playwright/test'

test.describe('Brainstorm', () => {
  test('should create session and view immutable content', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: 'New Project' }).first().click()
    await page.getByLabel(/name/i).fill('E2E Brainstorm Project')
    await page.getByRole('button', { name: 'Create Project' }).click()
    await expect(page).toHaveURL(/\/projects\/[^/]+\/overview/)

    await page.getByRole('navigation').getByRole('link', { name: 'Brainstorms' }).click()
    await expect(page).toHaveURL(/\/brainstorms$/)
    await page.getByRole('link', { name: 'New session' }).click()
    await expect(page).toHaveURL(/\/brainstorms\/new/)

    await page.getByLabel(/title/i).fill('My Ideas')
    await page.getByLabel(/content/i).fill('Combat should have hit stun. Health bars for all entities.')
    await page.getByLabel(/author/i).fill('E2E User')
    await page.getByRole('button', { name: 'Save session' }).click()

    await expect(page).toHaveURL(/\/brainstorms\/[^/]+$/)
    await expect(page.getByRole('heading', { name: 'My Ideas' })).toBeVisible()
    await expect(page.getByText('Combat should have hit stun')).toBeVisible()
    await expect(page.getByText('E2E User')).toBeVisible()
  })
})
