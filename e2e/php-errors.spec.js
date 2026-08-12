/**
 * The surfaces this plugin actually renders must stay free of PHP diagnostics.
 *
 * `expectNoPhpDiagnostics()` treats fatals and parse errors as never acceptable
 * and scopes warnings, notices and deprecations to this plugin's own PHP files
 * (see helpers.js), so unrelated core noise cannot turn CI red while a real
 * problem in a block's render.php still does.
 *
 * The front-end cases matter most: soli/menu-link and soli/random-descendant-card
 * are server-rendered through `build/<block>/render.php`, and the mega panel runs
 * this plugin's `render_block` filter in `inc/blocks.php`. None of that PHP
 * executes when only the editor is opened.
 */

const { test, expect } = require('@playwright/test');
const {
	loginAsAdmin,
	createPage,
	openBlockEditor,
	serializeBlock,
	expectNoPhpDiagnostics,
} = require('./helpers');

test.describe('renders without PHP diagnostics', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		// createPage() uses wp.apiFetch, which only exists on wp-admin screens.
		await page.goto('/wp-admin/');
	});

	test('on a front-end page carrying every menu block', async ({ page }) => {
		// soli/image-login is a static block, so its markup has to be exactly what
		// its save.js produces. Let the editor serialize it.
		await openBlockEditor(page);
		const imageLogin = await serializeBlock(page, 'soli/image-login');
		await page.goto('/wp-admin/');

		const parent = await createPage(page, { title: 'Orkesten (diagnostics)' });
		await createPage(page, { title: 'Bigband (diagnostics)', parent: parent.id });

		const host = await createPage(page, {
			title: 'Menu blocks diagnostics',
			content:
				'<!-- wp:soli/menu-link {"linkType":"custom","url":"https://soli.nl/agenda","label":"Agenda"} /-->' +
				`<!-- wp:soli/random-descendant-card {"parentId":${parent.id}} /-->` +
				imageLogin +
				'<!-- wp:navigation -->' +
				'<!-- wp:navigation-submenu {"label":"Muziek","className":"is-soli-mega-panel"} -->' +
				'<!-- wp:navigation-link {"label":"Harmonie","url":"https://soli.nl/harmonie","kind":"custom"} /-->' +
				'<!-- /wp:navigation-submenu -->' +
				'<!-- /wp:navigation -->',
		});

		await page.goto(host.link);

		// Guard against the assertion reading a page where the blocks never ran:
		// an empty or 404 page would satisfy the diagnostics check vacuously.
		await expect(page.locator('.soli-menu-link a')).toHaveText('Agenda');
		await expect(page.locator('.soli-random-descendant-card')).toBeVisible();
		await expect(page.locator('li.is-soli-mega-panel')).toHaveCount(1);
		await expect(page.locator('.wp-block-soli-image-login')).toBeAttached();

		await expectNoPhpDiagnostics(page);
	});

	test('on a front-end page whose blocks resolve to nothing', async ({ page }) => {
		// Both render.php files take an early-return path when they cannot resolve
		// a target. That path touches different attributes, so it is worth its own
		// request.
		const created = await createPage(page, {
			title: 'Menu blocks diagnostics (unresolved)',
			content:
				'<!-- wp:soli/menu-link {"linkType":"custom","url":"","label":""} /-->' +
				'<!-- wp:soli/random-descendant-card {"parentId":0} /-->',
		});

		await page.goto(created.link);

		await expect(page.locator('.soli-menu-link')).toHaveCount(0);
		await expect(page.locator('.soli-random-descendant-card')).toHaveCount(0);

		await expectNoPhpDiagnostics(page);
	});

	test('on the front page', async ({ page }) => {
		await page.goto('/');
		await expectNoPhpDiagnostics(page);
	});

	test('in the block editor', async ({ page }) => {
		await openBlockEditor(page);
		await expectNoPhpDiagnostics(page);
	});

	test('on the plugins screen', async ({ page }) => {
		await page.goto('/wp-admin/plugins.php');
		await expectNoPhpDiagnostics(page);
	});
});
