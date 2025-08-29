import { test, expect } from '@playwright/test'

test.describe('Duplicate Pick Warning', () => {
  let leagueCode: string

  test.beforeEach(async ({ page }) => {
    const resetResponse = await page.request.post('/api/test/reset')
    const resetData = await resetResponse.json()
    leagueCode = resetData.leagueCode

    await page.request.post('/api/test/freeze-time', {
      data: { nowISOString: '2024-02-01T10:00:00Z' }
    })

    // Create Week 1 and Week 2
    await page.request.post('/api/test/make-week', {
      data: { weekNo: 1, games: 2 }
    })
    await page.request.post('/api/test/make-week', {
      data: { weekNo: 2, games: 2 }
    })

    // Create user and make Week 1 pick
    await page.goto(`/l/${leagueCode}/admin`)
    await page.locator('[data-cy="admin-generate-invite"]').click()
    
    await page.waitForSelector('code')
    const inviteElement = await page.locator('code').first()
    const inviteToken = await inviteElement.textContent() || ''

    await page.goto(`/l/${leagueCode}/claim/${inviteToken}`)
    await page.locator('[data-cy="claim-username"]').fill('testuser')
    await page.locator('[data-cy="claim-display-name"]').fill('Test User')
    await page.locator('[data-cy="claim-pin"]').fill('1234')
    await page.getByRole('button', { name: 'Join League' }).click()

    // Make Week 1 pick on KC
    await page.goto(`/l/${leagueCode}/week/1`)
    await page.locator('[data-cy="pick-KC"]').click()
    
    // Handle any initial duplicate warning
    const duplicateModal = page.locator('[data-cy="duplicate-warning"]')
    if (await duplicateModal.isVisible()) {
      await page.getByRole('button', { name: 'Confirm' }).click()
    }
    
    await expect(page.getByText('Pick saved. Locked for Week 1.')).toBeVisible()
  })

  test('should show duplicate warning when picking same team twice', async ({ page }) => {
    // Go to Week 2
    await page.goto(`/l/${leagueCode}/week/2`)
    
    // Try to pick KC again (already used in Week 1)
    await page.locator('[data-cy="pick-KC"]').click()
    
    // Should see duplicate warning modal
    const duplicateModal = page.locator('[data-cy="duplicate-warning"]')
    await expect(duplicateModal).toBeVisible()
    
    // Modal should explain the duplicate pick
    await expect(page.getByText(/already.*used/i)).toBeVisible()
    await expect(page.getByText('KC')).toBeVisible()
    
    // Should have Cancel and Confirm buttons
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible()
  })

  test('should cancel pick when user clicks cancel in duplicate warning', async ({ page }) => {
    await page.goto(`/l/${leagueCode}/week/2`)
    
    // Try to pick KC again
    await page.locator('[data-cy="pick-KC"]').click()
    
    // Cancel the duplicate pick
    const duplicateModal = page.locator('[data-cy="duplicate-warning"]')
    await expect(duplicateModal).toBeVisible()
    await page.getByRole('button', { name: 'Cancel' }).click()
    
    // Modal should close
    await expect(duplicateModal).not.toBeVisible()
    
    // Should still be on Week 2 page without pick confirmation
    await expect(page).toHaveURL(new RegExp(`/l/${leagueCode}/week/2$`))
    await expect(page.getByText('Pick saved. Locked for Week 2.')).not.toBeVisible()
    
    // Should still be able to pick a different team
    await page.locator('[data-cy="pick-SF"]').click()
    await expect(page.getByText('Pick saved. Locked for Week 2.')).toBeVisible()
  })

  test('should confirm pick when user clicks confirm in duplicate warning', async ({ page }) => {
    await page.goto(`/l/${leagueCode}/week/2`)
    
    // Try to pick KC again
    await page.locator('[data-cy="pick-KC"]').click()
    
    // Confirm the duplicate pick
    const duplicateModal = page.locator('[data-cy="duplicate-warning"]')
    await expect(duplicateModal).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()
    
    // Modal should close and pick should be saved
    await expect(duplicateModal).not.toBeVisible()
    await expect(page.getByText('Pick saved. Locked for Week 2.')).toBeVisible()
    
    // Should show pick badge for KC
    const pickBadge = page.locator('[data-cy="pick-badge-KC"]')
    if (await pickBadge.isVisible()) {
      await expect(pickBadge).toContainText('KC')
      await expect(pickBadge).toContainText('YOU')
    }
  })

  test('should not show duplicate warning for different teams', async ({ page }) => {
    await page.goto(`/l/${leagueCode}/week/2`)
    
    // Pick SF (different from Week 1's KC)
    await page.locator('[data-cy="pick-SF"]').click()
    
    // Should NOT see duplicate warning
    const duplicateModal = page.locator('[data-cy="duplicate-warning"]')
    await expect(duplicateModal).not.toBeVisible()
    
    // Should go straight to pick confirmation
    await expect(page.getByText('Pick saved. Locked for Week 2.')).toBeVisible()
  })

  test('should show used teams with different styling', async ({ page }) => {
    await page.goto(`/l/${leagueCode}/week/2`)
    
    // KC button should show as "used" with different styling
    const kcButton = page.locator('[data-cy="pick-KC"]')
    await expect(kcButton).toBeVisible()
    await expect(kcButton).toContainText('USED')
    
    // Should have diagonal stripe overlay (visual indication)
    // This tests the CSS class application
    await expect(kcButton).toHaveClass(/bg-charcoal-700/)
    
    // SF should not show as used
    const sfButton = page.locator('[data-cy="pick-SF"]')
    await expect(sfButton).not.toContainText('USED')
  })
})