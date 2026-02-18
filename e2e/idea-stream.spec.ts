import { test, expect } from '@playwright/test'

test.describe('Idea Stream', () => {
  test('should open Idea Stream, create thread and post message', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await page.getByRole('link', { name: 'New Project' }).first().click()
    await page.getByLabel(/name/i).fill('E2E Idea Stream Project')
    await page.getByRole('button', { name: 'Create Project' }).click()
    await expect(page).toHaveURL(/\/projects\/[^/]+\/overview/)

    await page.getByRole('navigation').getByRole('link', { name: 'Idea Stream' }).click()
    await expect(page).toHaveURL(/\/idea-stream$/)

    await expect(
      page.getByPlaceholder('Start a new thread...')
    ).toBeVisible()
    await page.getByPlaceholder('Start a new thread...').fill('E2E thread topic')
    await page.getByRole('button', { name: 'Post new thread' }).click()

    await expect(page.getByText('E2E thread topic')).toBeVisible()

    await expect(page.getByPlaceholder('Write a message...')).toBeVisible()
    await page.getByPlaceholder('Write a message...').fill('First reply in thread')
    await page.getByRole('button', { name: 'Send message' }).click()

    await expect(page.getByText('First reply in thread')).toBeVisible()
  })
})
