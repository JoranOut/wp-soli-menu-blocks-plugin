const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for the Soli Menu Blocks plugin e2e tests.
 *
 * `wp-scripts test-playwright` reads .wp-env.json and exports WP_BASE_URL
 * pointing at the tests environment (port 8891), so the tests never touch
 * the development site on port 8890.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	timeout: 90_000,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8891',
		viewport: { width: 1280, height: 900 },
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		actionTimeout: 15_000,
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: {
		command: 'npm run env:start',
		url: process.env.WP_BASE_URL || 'http://localhost:8891',
		reuseExistingServer: true,
		timeout: 180_000,
	},
});
