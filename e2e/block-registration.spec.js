/**
 * Every block this plugin ships must be registered on both sides:
 *
 * - PHP, via build/blocks-manifest.php (inc/blocks.php). Broken by a missing or
 *   stale build directory.
 * - JavaScript, via build/<block>/index.js. Broken by an unregistered or
 *   renamed block in src/.
 */

const { test, expect } = require('@playwright/test');
const { BLOCKS, EDITOR_BLOCKS, loginAsAdmin, openBlockEditor } = require('./helpers');

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

	test('all editor blocks are registered in the editor', async ({ page }) => {
		await openBlockEditor(page);

		const names = await page.evaluate(() =>
			window.wp.blocks.getBlockTypes().map((type) => type.name)
		);

		for (const block of EDITOR_BLOCKS) {
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

		const variation = await page.evaluate(() =>
			window.wp.blocks
				.getBlockVariations('core/navigation-submenu')
				.find((candidate) => candidate.name === 'soli/mega-panel')
		);

		expect(variation, 'soli/mega-panel is not registered on core/navigation-submenu').toBeTruthy();
		expect(variation.title).toBe('Mega Panel');
		expect(variation.scope).toContain('inserter');
		// The variation tags itself with this class; inc/blocks.php keys its
		// front-end stylesheet off the very same class.
		expect(variation.attributes.className).toBe('is-soli-mega-panel');
	});

	test('the mega panel block type is restricted to the navigation block', async ({ page }) => {
		await page.goto('/wp-admin/');

		const parent = await page.evaluate(async () => {
			const blockType = await window.wp.apiFetch({
				path: '/wp/v2/block-types/soli/mega-panel',
			});
			return blockType.parent;
		});

		expect(parent).toEqual(['core/navigation']);
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
