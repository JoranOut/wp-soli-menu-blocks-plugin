/**
 * The plugin must load and activate without producing PHP errors.
 *
 * WP_DEBUG and WP_DEBUG_DISPLAY are enabled in .wp-env.json, so a bad require,
 * a syntax error or a deprecated call surfaces directly in the HTML.
 */

const { test, expect } = require('@playwright/test');
const { loginAsAdmin, expectNoPhpErrors } = require('./helpers');

test.describe('Plugin activation', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('is listed as active on the plugins screen', async ({ page }) => {
		const response = await page.goto('/wp-admin/plugins.php');
		expect(response.status()).toBe(200);

		// Matched on the plugin header name, not the directory name: wp-env mounts
		// the plugin from whatever folder the checkout lives in.
		const row = page.locator('#the-list tr').filter({
			hasText: 'Soli Menu Blocks Plugin',
		});

		await expect(row).toHaveCount(1);
		await expect(row).toHaveClass(/active/);

		// An active plugin offers "Deactivate", never "Activate".
		await expect(row.getByRole('link', { name: 'Deactivate' })).toBeVisible();
	});

	test('reports the expected version on the plugins screen', async ({ page }) => {
		await page.goto('/wp-admin/plugins.php');

		const row = page
			.locator('#the-list tr')
			.filter({ hasText: 'Soli Menu Blocks Plugin' })
			.first();

		await expect(row).toContainText('Version 1.0.2');
	});

	test('produces no PHP errors in wp-admin', async ({ page }) => {
		await page.goto('/wp-admin/plugins.php');
		expectNoPhpErrors(await page.content(), 'the plugins screen');

		await page.goto('/wp-admin/');
		expectNoPhpErrors(await page.content(), 'the dashboard');
	});

	test('produces no PHP errors on the front end', async ({ page }) => {
		const response = await page.goto('/');
		expect(response.status()).toBe(200);
		expectNoPhpErrors(await page.content(), 'the front page');
	});
});
