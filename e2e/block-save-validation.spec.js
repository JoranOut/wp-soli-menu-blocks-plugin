/**
 * Blocks must survive a save/reload round trip.
 *
 * If a block's save.js stops matching its block.json attributes, WordPress
 * marks the block invalid on reload and shows "This block contains unexpected
 * or invalid content", which is the classic way a block plugin breaks without
 * anything erroring.
 */

const { test, expect } = require('@playwright/test');
const {
	BLOCKS,
	loginAsAdmin,
	openBlockEditor,
	searchInserter,
	inserterItem,
} = require('./helpers');

/**
 * Saves the post currently open in the editor and returns its ID.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          title
 * @return {Promise<number>} The saved post ID.
 */
async function savePost(page, title) {
	await page.evaluate((postTitle) => {
		window.wp.data.dispatch('core/editor').editPost({ title: postTitle, status: 'publish' });
	}, title);

	await page.evaluate(() => window.wp.data.dispatch('core/editor').savePost());

	await page.waitForFunction(() => !window.wp.data.select('core/editor').isSavingPost(), null, {
		timeout: 30_000,
	});

	const postId = await page.evaluate(() =>
		window.wp.data.select('core/editor').getCurrentPostId()
	);
	expect(postId, 'the post was not saved').toBeGreaterThan(0);

	return postId;
}

test.describe('Block save validation', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
	});

	test('an inserted Image Login block survives save and reload', async ({ page }) => {
		await openBlockEditor(page);

		// Insert through the real inserter, the way an author would.
		await searchInserter(page, 'Image Login');
		await inserterItem(page, 'soli/image-login').click();

		await expect
			.poll(() =>
				page.evaluate(() =>
					window.wp.data
						.select('core/block-editor')
						.getBlocks()
						.map((block) => block.name)
				)
			)
			.toContain('soli/image-login');

		const postId = await savePost(page, 'Image Login save test');

		// Reload from the database: this is where invalid content shows up.
		await openBlockEditor(page, postId);

		const blocks = await page.evaluate(() =>
			window.wp.data
				.select('core/block-editor')
				.getBlocks()
				.map((block) => ({ name: block.name, isValid: block.isValid }))
		);

		expect(blocks).toEqual([{ name: 'soli/image-login', isValid: true }]);

		await expect(page.locator('.block-editor-block-list__block.has-warning')).toHaveCount(0);
		await expect(page.getByText('unexpected or invalid content')).toHaveCount(0);
	});

	for (const block of BLOCKS) {
		test(`${block.name} serializes and reparses without becoming invalid`, async ({ page }) => {
			await openBlockEditor(page);

			const result = await page.evaluate((blockName) => {
				const { createBlock, serialize, parse } = window.wp.blocks;

				const serialized = serialize([createBlock(blockName)]);
				const reparsed = parse(serialized);

				return {
					serialized,
					blocks: reparsed.map((parsed) => ({
						name: parsed.name,
						isValid: parsed.isValid,
					})),
				};
			}, block.name);

			expect(result.serialized, 'the block serialized to nothing').toContain(block.name);
			expect(result.blocks).toEqual([{ name: block.name, isValid: true }]);
		});
	}

	test('the mega panel variation serializes and reparses without becoming invalid', async ({
		page,
	}) => {
		await openBlockEditor(page);

		const result = await page.evaluate(() => {
			const { createBlock, serialize, parse, getBlockVariations } = window.wp.blocks;

			const variation = getBlockVariations('core/navigation-submenu').find(
				(candidate) => candidate.name === 'soli/mega-panel'
			);

			const serialized = serialize([
				createBlock('core/navigation-submenu', variation.attributes),
			]);
			const reparsed = parse(serialized);

			return {
				serialized,
				blocks: reparsed.map((parsed) => ({
					name: parsed.name,
					isValid: parsed.isValid,
					className: parsed.attributes.className,
				})),
				// The variation must still be recognised in saved content.
				isActive: variation.isActive({ className: 'is-soli-mega-panel' }),
			};
		});

		expect(result.serialized).toContain('is-soli-mega-panel');
		expect(result.blocks).toEqual([
			{
				name: 'core/navigation-submenu',
				isValid: true,
				className: 'is-soli-mega-panel',
			},
		]);
		expect(result.isActive).toBe(true);
	});
});
