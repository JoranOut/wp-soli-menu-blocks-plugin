/**
 * The server-rendered blocks must produce real markup on the front end.
 *
 * These are the blocks with a render.php, so this exercises the plugin's PHP
 * output rather than just its registration.
 */

const { test, expect } = require('@playwright/test');
const {
	loginAsAdmin,
	createPage,
	expectNoPhpErrors,
	openBlockEditor,
	serializeBlock,
} = require('./helpers');

test.describe('Front-end rendering', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		// createPage() uses wp.apiFetch, which only exists on wp-admin screens.
		await page.goto('/wp-admin/');
	});

	test('the menu link block renders an anchor with its label and URL', async ({ page }) => {
		const created = await createPage(page, {
			title: 'Menu link render test',
			content:
				'<!-- wp:soli/menu-link {"linkType":"custom","url":"https://soli.nl/agenda","label":"Agenda"} /-->',
		});

		await page.goto(created.link);

		const link = page.locator('.soli-menu-link a');
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute('href', 'https://soli.nl/agenda');
		await expect(link).toHaveText('Agenda');

		expectNoPhpErrors(await page.content(), 'the menu link page');
	});

	test('the menu link block opens in a new tab when configured', async ({ page }) => {
		const created = await createPage(page, {
			title: 'Menu link new tab test',
			content:
				'<!-- wp:soli/menu-link {"linkType":"custom","url":"https://soli.nl/winkel","label":"Winkel","opensInNewTab":true} /-->',
		});

		await page.goto(created.link);

		const link = page.locator('.soli-menu-link a');
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
	});

	test('the menu link block renders nothing when it has no target', async ({ page }) => {
		// render.php bails out on the front end when no href could be resolved,
		// so a half-configured block must not leak an empty wrapper.
		const created = await createPage(page, {
			title: 'Menu link empty test',
			content: '<!-- wp:soli/menu-link {"linkType":"custom","url":"","label":""} /-->',
		});

		await page.goto(created.link);

		await expect(page.locator('.soli-menu-link')).toHaveCount(0);
		expectNoPhpErrors(await page.content(), 'the empty menu link page');
	});

	test('the random descendant card renders a descendant of the chosen parent', async ({
		page,
	}) => {
		const parent = await createPage(page, { title: 'Orkesten' });
		const child = await createPage(page, {
			title: 'Harmonie orkest',
			parent: parent.id,
		});

		const host = await createPage(page, {
			title: 'Random descendant card render test',
			content: `<!-- wp:soli/random-descendant-card {"parentId":${parent.id}} /-->`,
		});

		await page.goto(host.link);

		const card = page.locator('.soli-random-descendant-card');
		await expect(card).toBeVisible();
		await expect(card.locator('.soli-random-descendant-card__title')).toHaveText(
			'Harmonie orkest'
		);
		await expect(card.locator('a.soli-random-descendant-card__link')).toHaveAttribute(
			'href',
			child.link
		);

		expectNoPhpErrors(await page.content(), 'the random descendant card page');
	});

	test('the random descendant card renders nothing without a parent page', async ({ page }) => {
		const created = await createPage(page, {
			title: 'Random descendant card empty test',
			content: '<!-- wp:soli/random-descendant-card {"parentId":0} /-->',
		});

		await page.goto(created.link);

		await expect(page.locator('.soli-random-descendant-card')).toHaveCount(0);
		expectNoPhpErrors(await page.content(), 'the empty random descendant card page');
	});

	test('the image login block renders its saved markup and assets', async ({ page }) => {
		// soli/image-login is a static block, so the post content has to be the
		// markup its save.js produces. Let the editor serialize it.
		await openBlockEditor(page);
		const content = await serializeBlock(page, 'soli/image-login');
		expect(content).toContain('wp-block-soli-image-login');

		await page.goto('/wp-admin/');
		const created = await createPage(page, { title: 'Image login render test', content });

		// view.js runs on this page. A wrong script dependency (a missing
		// react-jsx-runtime, say) shows up here and nowhere else.
		const consoleErrors = [];
		page.on('console', (message) => {
			if (message.type() === 'error') {
				consoleErrors.push(message.text());
			}
		});
		page.on('pageerror', (error) => consoleErrors.push(error.message));

		await page.goto(created.link);

		// A freshly created block has no inner blocks yet, so the wrapper is present
		// but has no height of its own.
		await expect(page.locator('.wp-block-soli-image-login')).toBeAttached();

		// The block's stylesheet must reach the page. WordPress inlines small block
		// styles instead of linking them, so accept either form.
		const styleReached = await page.evaluate(() => {
			const inlined = !!document.querySelector('style[id*="soli-image-login-style"]');
			const linked = [...document.querySelectorAll('link[rel="stylesheet"]')].some((el) =>
				el.href.includes('image-login/style-index.css')
			);
			return { inlined, linked };
		});
		expect(
			styleReached.inlined || styleReached.linked,
			'the image login stylesheet was neither inlined nor linked'
		).toBe(true);

		// viewScript must be enqueued on pages that use the block.
		await expect(page.locator('script[src*="image-login/view.js"]')).toHaveCount(1);

		expectNoPhpErrors(await page.content(), 'the image login page');
		expect(consoleErrors, 'the front end logged JavaScript errors').toEqual([]);
	});

	test('a mega panel submenu renders and pulls in its stylesheet', async ({ page }) => {
		// The mega panel is a core/navigation-submenu carrying is-soli-mega-panel.
		// inc/blocks.php hooks render_block to enqueue the panel stylesheet only for
		// submenus with that class, because a block variation cannot declare styles.
		const created = await createPage(page, {
			title: 'Mega panel render test',
			content:
				'<!-- wp:navigation -->' +
				'<!-- wp:navigation-submenu {"label":"Muziek","className":"is-soli-mega-panel"} -->' +
				'<!-- wp:navigation-link {"label":"Harmonie","url":"https://soli.nl/harmonie","kind":"custom"} /-->' +
				'<!-- /wp:navigation-submenu -->' +
				'<!-- /wp:navigation -->',
		});

		await page.goto(created.link);

		const submenu = page.locator('li.is-soli-mega-panel');
		await expect(submenu).toHaveCount(1);
		await expect(submenu).toContainText('Muziek');
		await expect(submenu).toContainText('Harmonie');

		const stylesheet = page.locator('link[href*="mega-panel/style-index.css"]');
		await expect(stylesheet).toHaveCount(1);

		// The stylesheet must be cache-busted with its own filemtime, a bare unix
		// timestamp. inc/blocks.php used to hand the stylesheet *URL* to file_exists(),
		// which can never succeed, so the version came out null and wp_enqueue_style()
		// emitted no ?ver= at all: a rebuilt panel never reached browsers holding the
		// old one. Anything other than a timestamp here means that path broke again.
		const href = await stylesheet.getAttribute('href');
		const version = new URL(href, page.url()).searchParams.get('ver');
		expect(version, `expected a filemtime version on ${href}`).toMatch(/^\d+$/);

		expectNoPhpErrors(await page.content(), 'the mega panel page');
	});

	test('the mega panel stylesheet stays off pages without a mega panel', async ({ page }) => {
		const created = await createPage(page, {
			title: 'Plain navigation test',
			content:
				'<!-- wp:navigation -->' +
				'<!-- wp:navigation-link {"label":"Home","url":"https://soli.nl","kind":"custom"} /-->' +
				'<!-- /wp:navigation -->',
		});

		await page.goto(created.link);

		await expect(page.locator('link[href*="mega-panel/style-index.css"]')).toHaveCount(0);
	});

	test('the image login block enqueues nothing on pages that do not use it', async ({ page }) => {
		const created = await createPage(page, {
			title: 'No image login here',
			content: '<!-- wp:paragraph --><p>Geen blokken van Soli.</p><!-- /wp:paragraph -->',
		});

		await page.goto(created.link);

		await expect(page.locator('script[src*="image-login/view.js"]')).toHaveCount(0);
		await expect(page.locator('.wp-block-soli-image-login')).toHaveCount(0);
	});
});
