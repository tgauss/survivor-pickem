import { test, expect } from '@playwright/test'

test.describe('Invite → Claim → Login → Pick Flow', () => {
  let leagueCode: string
  let inviteToken: string

  test.beforeEach(async ({ page }) => {
    // Reset local adapter with test data
    const resetResponse = await page.request.post('/api/test/reset')
    const resetData = await resetResponse.json()
    expect(resetData.success).toBe(true)
    leagueCode = resetData.leagueCode

    // Freeze time to ensure consistent test behavior
    await page.request.post('/api/test/freeze-time', {
      data: { nowISOString: '2024-02-01T10:00:00Z' }
    })

    // Create Week 1 with test games
    await page.request.post('/api/test/make-week', {
      data: { weekNo: 1, games: 2 }
    })
  })

  test('should complete full invite → claim → pick flow', async ({ page }) => {
    // 1. Admin generates invite
    await page.goto(`/l/${leagueCode}/admin`)
    
    // Wait for page to load and show either "No Leagues Found" or league interface
    await page.waitForSelector('h1:has-text("Admin Dashboard")', { timeout: 10000 })
    
    // Wait for React component to load and API calls to complete
    // Either we'll see "No Leagues Found" or the generate invite button
    try {
      await page.waitForSelector('[data-cy="admin-generate-invite"]', { timeout: 15000 })
    } catch (error) {
      // If generate button not found, check if we need to create a league first
      const noLeaguesText = page.getByText('No Leagues Found')
      if (await noLeaguesText.isVisible()) {
        throw new Error('Admin page shows "No Leagues Found" - leagues not loaded from API')
      }
      throw error
    }
    
    await page.locator('[data-cy="admin-generate-invite"]').click()
    
    // Wait for invite to be generated and get the token
    await page.waitForSelector('[data-cy*="invite-token"]', { timeout: 5000 })
    const inviteElement = await page.locator('[data-cy*="invite-token"]').first()
    inviteToken = await inviteElement.textContent() || ''
    expect(inviteToken).toBeTruthy()
    console.log('E2E: Extracted invite token:', inviteToken)

    // 2. Visit claim page
    await page.goto(`/l/${leagueCode}/claim/${inviteToken}`)
    
    // 3. Fill claim form
    await page.locator('[data-cy="claim-username"]').fill('testuser')
    await page.locator('[data-cy="claim-display-name"]').fill('Test User')
    await page.locator('[data-cy="claim-pin"]').fill('1234')
    
    await page.getByRole('button', { name: 'Join League' }).click()

    // 4. Should land on leaderboard after claim
    await expect(page).toHaveURL(new RegExp(`/l/${leagueCode}$`))
    await expect(page.getByText('Test User')).toBeVisible()

    // 5. Navigate to make pick
    await page.getByText('Make Pick').click()
    await expect(page).toHaveURL(new RegExp(`/l/${leagueCode}/week/1$`))

    // 6. Select a team (KC from our test data)
    await page.locator('[data-cy="pick-KC"]').click()
    
    // Confirm pick in modal if duplicate warning appears
    const duplicateModal = page.locator('[data-cy="duplicate-warning"]')
    if (await duplicateModal.isVisible()) {
      await page.getByRole('button', { name: 'Confirm' }).click()
    }

    // 7. Should see pick confirmation
    await expect(page.getByText('Pick saved. Locked for Week 1.')).toBeVisible()
    
    // 8. Should see PickBadge when revealed
    const pickBadge = page.locator('[data-cy="pick-badge-KC"]')
    if (await pickBadge.isVisible()) {
      await expect(pickBadge).toContainText('KC')
      await expect(pickBadge).toContainText('YOU')
    }

    // 9. Return to leaderboard and verify entry
    await page.goto(`/l/${leagueCode}`)
    await expect(page.locator('[data-cy="lb-row-test-user"]')).toBeVisible()
    await expect(page.getByText('Submitted')).toBeVisible()
  })

  test('should show login link when not logged in', async ({ page }) => {
    await page.goto(`/l/${leagueCode}`)
    
    await expect(page.locator('[data-cy="nav-login"]')).toBeVisible()
    await expect(page.locator('[data-cy="nav-login"]')).toContainText('Login')
  })

  test('should handle claim form validation', async ({ page }) => {
    await page.goto(`/l/${leagueCode}/claim/invalid-token`)
    
    await expect(page.getByText('Invalid or expired invite')).toBeVisible()
  })
})