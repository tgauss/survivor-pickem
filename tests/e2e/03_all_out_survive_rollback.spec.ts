import { test, expect } from '@playwright/test'

test.describe('All Out Survive Scenario', () => {
  let leagueCode: string

  test.beforeEach(async ({ page }) => {
    // Reset and set up test data
    const resetResponse = await page.request.post('/api/test/reset')
    const resetData = await resetResponse.json()
    leagueCode = resetData.leagueCode

    await page.request.post('/api/test/freeze-time', {
      data: { nowISOString: '2024-02-01T10:00:00Z' }
    })

    await page.request.post('/api/test/make-week', {
      data: { weekNo: 1, games: 2 }
    })
  })

  test('should trigger all-out survive when all entries lose', async ({ page }) => {
    // Create two users both picking teams that will lose
    const users = [
      { username: 'loser1', displayName: 'Loser One', team: 'KC' },
      { username: 'loser2', displayName: 'Loser Two', team: 'SF' }
    ]

    // Create both entries
    for (const user of users) {
      // Generate invite
      await page.goto(`/l/${leagueCode}/admin`)
      await page.locator('[data-cy="admin-generate-invite"]').click()
      
      await page.waitForSelector('code')
      const inviteElement = await page.locator('code').first()
      const inviteToken = await inviteElement.textContent() || ''

      // Claim invite
      await page.goto(`/l/${leagueCode}/claim/${inviteToken}`)
      await page.locator('[data-cy="claim-username"]').fill(user.username)
      await page.locator('[data-cy="claim-display-name"]').fill(user.displayName)
      await page.locator('[data-cy="claim-pin"]').fill('1234')
      await page.getByRole('button', { name: 'Join League' }).click()

      // Make pick
      await page.goto(`/l/${leagueCode}/week/1`)
      await page.locator(`[data-cy="pick-${user.team}"]`).click()
      
      const duplicateModal = page.locator('[data-cy="duplicate-warning"]')
      if (await duplicateModal.isVisible()) {
        await page.getByRole('button', { name: 'Confirm' }).click()
      }
    }

    // Go to admin and simulate both teams losing by making sure neither KC nor SF wins
    // The local adapter should be set up so that when we score, both picks lose
    await page.goto(`/l/${leagueCode}/admin`)
    
    // Score the week (should trigger all-out survive)
    await page.locator('[data-cy="admin-score-week"]').click()
    
    // Wait for scoring to complete
    await page.waitForTimeout(1000)
    
    // Reveal the week to see results
    await page.locator('[data-cy="admin-reveal-now"]').click()
    await page.fill('textarea[placeholder*="Technical issue"]', 'All-out survive test')
    await page.getByRole('button', { name: 'Force Reveal' }).click()
    
    // Go to leaderboard and verify all-out survive behavior
    await page.goto(`/l/${leagueCode}`)
    
    // Should see the all-out survive banner
    await expect(page.getByText('Everyone lost. No strikes this week.')).toBeVisible()
    
    // Both users should still be alive (strikes not incremented)
    await expect(page.locator('[data-cy="lb-row-loser-one"]')).toBeVisible()
    await expect(page.locator('[data-cy="lb-row-loser-two"]')).toBeVisible()
    
    // Both should be in "Alive" section, not eliminated
    const aliveSection = page.getByText('Alive (2)')
    await expect(aliveSection).toBeVisible()
    
    // Verify no strikes were added (users should have 0 strikes)
    const userRows = page.locator('[data-cy^="lb-row-"]')
    for (let i = 0; i < await userRows.count(); i++) {
      const row = userRows.nth(i)
      // Strike icons should not be present (Skull icons)
      await expect(row.locator('.lucide-skull')).toHaveCount(0)
    }
  })

  test('should show rollback indicator when applied', async ({ page }) => {
    // Set up same scenario as above
    const users = [
      { username: 'user1', displayName: 'User One', team: 'KC' },
      { username: 'user2', displayName: 'User Two', team: 'SF' }
    ]

    for (const user of users) {
      await page.goto(`/l/${leagueCode}/admin`)
      await page.locator('[data-cy="admin-generate-invite"]').click()
      
      await page.waitForSelector('code')
      const inviteElement = await page.locator('code').first()
      const inviteToken = await inviteElement.textContent() || ''

      await page.goto(`/l/${leagueCode}/claim/${inviteToken}`)
      await page.locator('[data-cy="claim-username"]').fill(user.username)
      await page.locator('[data-cy="claim-display-name"]').fill(user.displayName)
      await page.locator('[data-cy="claim-pin"]').fill('1234')
      await page.getByRole('button', { name: 'Join League' }).click()

      await page.goto(`/l/${leagueCode}/week/1`)
      await page.locator(`[data-cy="pick-${user.team}"]`).click()
      
      const duplicateModal = page.locator('[data-cy="duplicate-warning"]')
      if (await duplicateModal.isVisible()) {
        await page.getByRole('button', { name: 'Confirm' }).click()
      }
    }

    // Trigger all-out survive
    await page.goto(`/l/${leagueCode}/admin`)
    await page.locator('[data-cy="admin-score-week"]').click()
    await page.waitForTimeout(1000)

    // Verify admin shows rollback indicator
    await expect(page.getByText('Rolled Back')).toBeVisible()
  })
})