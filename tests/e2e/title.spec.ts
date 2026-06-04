import { expect, test } from '@playwright/test';

test.describe('title screen', () => {
  test('renders the title surface and keeps the poster focused on the lead performer', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('本番中 x 舞台裏');
    await expect(page.getByRole('heading', { name: '本番中 x 舞台裏' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: '本番中 x 舞台裏' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'はじめる' })).toBeVisible();

    const posterPosition = await page.locator('.title-ghost-stage img').evaluate((image) => {
      return getComputedStyle(image).objectPosition;
    });
    expect(posterPosition).toBe('50% 20%');
  });
});
