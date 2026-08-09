/**
 * Every block this plugin ships must be registered on both sides:
 *
 * - PHP, via build/blocks-manifest.php (inc/blocks.php). Broken by a missing or
 *   stale build directory.
 * - JavaScript, via build/<block>/index.js. Broken by an unregistered or
 *   renamed block in src/.
 *
 * The mega panel is the exception: it is a variation of core/navigation-submenu
 * and so must be registered on neither side as a block type.
 */

const { test, expect } = require('@playwright/test');
const { BLOCKS, MEGA_PANEL, loginAsAdmin, openBlockEditor } = require('./helpers');

test.describe('Block registration', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('all blocks are registered server-side', async ({ page }) => {
		await page.goto('/wp-admin/');

		const blockTypes = await page.evaluate(() =>
			window.wp.apiFetch({ path: '/wp/v2/block-types' })
		);
		const byName = new Map(blockTypes.map((type) => [type.name, type]));

		for (const block of BLOCKS) {
			const registered = byName.get(block.name);
			expect(registered, `${block.name} is missing from /wp/v2/block-types`).toBeTruthy();
			expect(registered.title).toBe(block.title);
		}
	});

	test('all blocks are registered in the editor', async ({ page }) => {
		await openBlockEditor(page);

		const names = await page.evaluate(() =>
			window.wp.blocks.getBlockTypes().map((type) => type.name)
		);

		for (const block of BLOCKS) {
			expect(names, `${block.name} is not registered in the editor`).toContain(block.name);
		}
	});

	test('every registered block loads its compiled editor script', async ({ page }) => {
		await openBlockEditor(page);

		// A block registered from block.json without a built index.js would have no
		// edit function, which is exactly what a missing build/ directory looks like.
		const missingEdit = await page.evaluate(() =>
			window.wp.blocks
				.getBlockTypes()
				.filter((type) => type.name.startsWith('soli/') && typeof type.edit !== 'function')
				.map((type) => type.name)
		);

		expect(missingEdit).toEqual([]);
	});

	test('the mega panel is a navigation submenu variation', async ({ page }) => {
		await openBlockEditor(page);

		const variation = await page.evaluate(
			({ parentBlock, name }) =>
				window.wp.blocks
					.getBlockVariations(parentBlock)
					.find((candidate) => candidate.name === name),
			MEGA_PANEL
		);

		// A variation has no block type to carry block.json's editorScript, so
		// inc/blocks.php enqueues build/mega-panel/index.js by hand. Drop that
		// enqueue and the variation disappears here.
		expect(
			variation,
			`${MEGA_PANEL.name} is not registered on ${MEGA_PANEL.parentBlock}`
		).toBeTruthy();
		expect(variation.title).toBe(MEGA_PANEL.title);
		expect(variation.scope).toContain('inserter');
		// The variation tags itself with this class; inc/blocks.php keys its
		// front-end stylesheet off the very same class.
		expect(variation.attributes.className).toBe(MEGA_PANEL.className);
	});

	test('the mega panel is registered as a variation only, never as a block type', async ({
		page,
	}) => {
		// The mega panel used to be registered twice: as a variation in the editor
		// and, because build/blocks-manifest.php lists it, as a block type in PHP.
		// That second registration is unusable by design -- no editor code can
		// create a block type the editor does not know -- so inc/blocks.php now
		// skips it. Registering it in PHP again must fail this test.
		await page.goto('/wp-admin/');

		const serverSide = await page.evaluate(() =>
			window.wp
				.apiFetch({ path: '/wp/v2/block-types' })
				.then((types) => types.map((type) => type.name))
		);

		// Sanity check: this endpoint really does list the plugin's own blocks, so a
		// missing mega panel below means absence and not an empty response.
		expect(serverSide).toContain('soli/menu-link');
		expect(
			serverSide,
			`${MEGA_PANEL.name} is registered server-side but has no editor counterpart`
		).not.toContain(MEGA_PANEL.name);

		await openBlockEditor(page);

		const editorSide = await page.evaluate((name) => {
			const created = window.wp.blocks.createBlock(name);

			return {
				blockType: window.wp.blocks.getBlockType(name) || null,
				createdName: created.name,
				serialized: window.wp.blocks.serialize([created]),
			};
		}, MEGA_PANEL.name);

		// This is what made the server-side block type useless, and why it had to go
		// rather than the variation: asking the editor for the name yields nothing, so
		// createBlock() degrades to the "missing block" placeholder and serializes to
		// an empty string. No amount of PHP registration can make it insertable.
		expect(editorSide.blockType).toBeNull();
		expect(editorSide.createdName).toBe('core/missing');
		expect(editorSide.serialized).toBe('');
	});

	test('menu link and random descendant card are server-rendered', async ({ page }) => {
		await page.goto('/wp-admin/');

		const blockTypes = await page.evaluate(() =>
			window.wp.apiFetch({ path: '/wp/v2/block-types' })
		);
		const byName = new Map(blockTypes.map((type) => [type.name, type]));

		// Both ship a render.php, so WordPress must treat them as dynamic blocks.
		for (const name of ['soli/menu-link', 'soli/random-descendant-card']) {
			expect(byName.get(name).is_dynamic, `${name} should be server-rendered`).toBe(true);
		}
	});

	test('the image login block is allowed inside the navigation block', async ({ page }) => {
		await page.goto('/wp-admin/');

		// inc/blocks.php filters block_type_metadata to append soli/image-login to
		// core/navigation's allowed blocks.
		const allowedBlocks = await page.evaluate(async () => {
			const navigation = await window.wp.apiFetch({
				path: '/wp/v2/block-types/core/navigation',
			});
			return navigation.allowed_blocks;
		});

		expect(allowedBlocks).toContain('soli/image-login');
	});
});
