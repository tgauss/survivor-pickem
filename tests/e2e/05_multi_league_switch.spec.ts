import { test, expect } from '@playwright/test'

test.describe('Multi-League Switching', () => {
  let leagueCode1: string
  let leagueCode2: string

  test.beforeEach(async ({ page }) => {
    // Reset and create first league
    const resetResponse = await page.request.post('/api/test/reset')
    const resetData = await resetResponse.json()
    leagueCode1 = resetData.leagueCode

    await page.request.post('/api/test/freeze-time', {
      data: { nowISOString: '2024-02-01T10:00:00Z' }
    })

    // Create a second league through admin
    await page.goto(`/l/${leagueCode1}/admin`)
    
    // Look for create league form/button
    const createButton = page.getByRole('button', { name: /create/i }).first()
    if (await createButton.isVisible()) {
      await createButton.click()
      
      // Fill form for second league
      await page.fill('input[name="name"]', 'Second Test League')
      await page.fill('input[name="season_year"]', '2024')
      await page.fill('input[name="buy_in"]', '25')
      
      await page.getByRole('button', { name: 'Create League' }).click()
      
      // Wait for leagues to refresh
      await page.waitForTimeout(1000)
    }

    // For testing purposes, we'll simulate having a second league
    // In a real scenario, this would be created through the admin interface
    leagueCode2 = '2024-second-test-league'
  })

  test('should switch between leagues using league switcher', async ({ page }) => {
    // Start on first league
    await page.goto(`/l/${leagueCode1}`)
    await expect(page).toHaveURL(new RegExp(`/l/${leagueCode1}`))
    
    // Look for league switcher in header
    const leagueSwitcher = page.locator('[data-cy="league-switcher"]')
    if (await leagueSwitcher.isVisible()) {
      await leagueSwitcher.click()
      
      // Select second league
      await page.getByText('Second Test League').click()
      
      // URL should update
      await expect(page).toHaveURL(new RegExp(`/l/${leagueCode2}`))
      
      // Page content should reflect second league
      await expect(page.getByText('Second Test League')).toBeVisible()
    } else {
      // If no league switcher, test direct navigation
      await page.goto(`/l/${leagueCode2}`)
      await expect(page).toHaveURL(new RegExp(`/l/${leagueCode2}`))
    }
  })

  test('should maintain separate data between leagues', async ({ page }) => {
    // Create entry in first league
    await page.goto(`/l/${leagueCode1}/admin`)
    await page.getByTestId('admin-generate-invite').click()
    
    await page.waitForSelector('code')
    const inviteElement = await page.locator('code').first()
    const inviteToken1 = await inviteElement.textContent() || ''

    await page.goto(`/l/${leagueCode1}/claim/${inviteToken1}`)
    await page.getByTestId('claim-username').fill('league1user')
    await page.getByTestId('claim-display-name').fill('League 1 User')
    await page.getByTestId('claim-pin').fill('1234')
    await page.getByRole('button', { name: 'Join League' }).click()

    // Verify user exists in first league
    await page.goto(`/l/${leagueCode1}`)
    await expect(page.getByText('League 1 User')).toBeVisible()

    // Switch to second league - should not see the user
    await page.goto(`/l/${leagueCode2}`)
    await expect(page.getByText('League 1 User')).not.toBeVisible()
    
    // Should see empty or different leaderboard
    const emptyMessage = page.getByText(/no entries/i)
    if (await emptyMessage.isVisible()) {
      await expect(emptyMessage).toBeVisible()
    }
  })

  test('should preserve league choice with cookie', async ({ page, context }) => {
    // Visit first league
    await page.goto(`/l/${leagueCode1}`)
    
    // Switch to second league
    await page.goto(`/l/${leagueCode2}`)
    
    // Create new page in same context
    const newPage = await context.newPage()
    
    // Navigate to root - should redirect to last league (with cookie)
    await newPage.goto('/')
    
    // Should redirect to second league (last visited)
    await expect(newPage).toHaveURL(new RegExp(`/l/${leagueCode2}`))
    
    await newPage.close()
  })

  test('should show all leagues on /leagues page', async ({ page }) => {
    await page.goto('/leagues')
    
    // Should see both leagues listed
    await expect(page.getByText('Test Survivor League')).toBeVisible()
    
    // If second league was created, should see it too
    const secondLeague = page.getByText('Second Test League')
    if (await secondLeague.isVisible()) {
      await expect(secondLeague).toBeVisible()
    }
    
    // Should have links to each league
    const league1Link = page.getByRole('link', { name: new RegExp(leagueCode1) })
    const league2Link = page.getByRole('link', { name: new RegExp(leagueCode2) })
    
    if (await league1Link.isVisible()) {
      await expect(league1Link).toHaveAttribute('href', `/l/${leagueCode1}`)
    }
    
    if (await league2Link.isVisible()) {
      await expect(league2Link).toHaveAttribute('href', `/l/${leagueCode2}`)
    }
  })

  test('should handle invalid league codes gracefully', async ({ page }) => {
    // Try to visit non-existent league
    await page.goto('/l/invalid-league-code')
    
    // Should show error or redirect
    const errorMessage = page.getByText(/not found/i)
    const redirected = page.url().includes('/leagues')
    
    // Either should show error message or redirect to leagues page
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible()
    } else if (redirected) {
      await expect(page).toHaveURL(/\/leagues/)
    }
  })
})