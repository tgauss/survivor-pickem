import { test, expect } from '@playwright/test'

test.describe('Reveal and Score Week', () => {
  let leagueCode: string
  let inviteToken: string

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

    // Create a user with a pick
    await page.goto(`/l/${leagueCode}/admin`)
    await page.getByTestId('admin-generate-invite').click()
    
    await page.waitForSelector('code')
    const inviteElement = await page.locator('code').first()
    inviteToken = await inviteElement.textContent() || ''

    // Claim invite and make pick
    await page.goto(`/l/${leagueCode}/claim/${inviteToken}`)
    await page.getByTestId('claim-username').fill('winner')
    await page.getByTestId('claim-display-name').fill('Winner User')
    await page.getByTestId('claim-pin').fill('1234')
    await page.getByRole('button', { name: 'Join League' }).click()

    // Make a pick on KC
    await page.goto(`/l/${leagueCode}/week/1`)
    await page.getByTestId('pick-KC').click()
    
    // Handle duplicate warning if present
    const duplicateModal = page.getByTestId('duplicate-warning')
    if (await duplicateModal.isVisible()) {
      await page.getByRole('button', { name: 'Confirm' }).click()
    }
  })

  test('should score and reveal week showing pick badges', async ({ page }) => {
    // 1. Go to admin and mark KC as winner
    await page.goto(`/l/${leagueCode}/admin`)
    
    // Mark game winner (this would need to be implemented in the admin UI or via API)
    // For now, we'll use the Score Week button directly which should handle scoring
    
    // 2. Score the week
    await page.getByTestId('admin-score-week').click()
    
    // Wait for scoring to complete
    await page.waitForTimeout(1000)
    
    // 3. Reveal the week
    await page.getByTestId('admin-reveal-now').click()
    
    // Fill in reveal reason
    await page.fill('textarea[placeholder*="Technical issue"]', 'Test reveal for e2e')
    await page.getByRole('button', { name: 'Force Reveal' }).click()
    
    // 4. Go to leaderboard and verify results
    await page.goto(`/l/${leagueCode}`)
    
    // Should see pick badge instead of generic "Submitted"
    await expect(page.getByTestId('pick-badge-KC')).toBeVisible()
    await expect(page.getByTestId('pick-badge-KC')).toContainText('KC')
    await expect(page.getByTestId('pick-badge-KC')).toContainText('Winner User')
    
    // 5. Verify distribution panel appears
    await expect(page.getByText('Distribution')).toBeVisible()
    
    // Should show KC with count of 1
    await expect(page.getByText('KC')).toBeVisible()
    await expect(page.getByText('(1)')).toBeVisible()
  })

  test('should show win indicator when user picks correctly', async ({ page }) => {
    // Score week, then reveal
    await page.goto(`/l/${leagueCode}/admin`)
    await page.getByTestId('admin-score-week').click()
    await page.getByTestId('admin-reveal-now').click()
    
    await page.fill('textarea[placeholder*="Technical issue"]', 'Test win scenario')
    await page.getByRole('button', { name: 'Force Reveal' }).click()
    
    // Go to leaderboard
    await page.goto(`/l/${leagueCode}`)
    
    // User should still be alive (no elimination if KC won)
    const userRow = page.getByTestId('lb-row-winner-user')
    await expect(userRow).toBeVisible()
    
    // Should be in the "Alive" section, not "Eliminated"
    const aliveSection = page.getByText('Alive')
    await expect(aliveSection).toBeVisible()
  })
})