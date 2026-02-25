import { test } from '@playwright/test'

// NOTE: Requires dedicated seeded data + storageState for user/staff sessions.
// Kept as smoke skeleton for Phase 6 and enabled when env fixtures are ready.
test.describe.skip('support-chat smoke', () => {
  test('user sends message and staff replies', async ({ page }) => {
    await page.goto('/platform/support-chat')

    // 1) user creates dialog and sends message
    // 2) staff opens /admin/support-chat and sees unanswered marker
    // 3) staff replies
    // 4) user receives reply and read marker updates
  })
})
