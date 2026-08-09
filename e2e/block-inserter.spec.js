/**
 * The blocks must be reachable through the inserter UI, which is the only way
 * an author would ever add them.
 */

const { test, expect } = require('@playwright/test');
const {
	BLOCKS,
	loginAsAdmin,
	openBlockEditor,
	searchInserter,
	inserterItem,
} = require('./helpers');

test.describe('Block inserter', () => {
	test.beforeEach(async ({ page }) => {
		await loginAsAdmin(page);
		await openBlockEditor(page);
	});

	for (const block of BLOCKS) {
		test(`offers "${block.title}" in the inserter`, async ({ page }) => {
			await searchInserter(page, block.title);

			const item = inserterItem(page, block.name);
			await expect(item).toHaveCount(1);
			await expect(item).toBeVisible();
			await expect(item).toContainText(block.title);
		});
	}

	test('does not offer the mega panel at the top level of a post', async ({ page }) => {
		// The mega panel is a core/navigation-submenu variation, and that block is
		// itself restricted to core/navigation, so it must not be insertable
		// straight into a post.
		await searchInserter(page, 'Mega Panel');

		await expect(inserterItem(page, 'core/navigation-submenu')).toHaveCount(0);
		await expect(
			page.locator('.block-editor-block-types-list__item', { hasText: /^Mega Panel$/ })
		).toHaveCount(0);
	});

	test('offers the mega panel in the navigation inserter', async ({ page }) => {
		const result = await page.evaluate(() => ({
			// The variation is scoped to the inserter...
			inserterVariations: window.wp.blocks
				.getBlockVariations('core/navigation-submenu', 'inserter')
				.map((variation) => variation.name),
			// ...on a block the navigation block accepts as a child...
			navigationAllows: window.wp.blocks
				.getBlockType('core/navigation')
				.allowedBlocks.includes('core/navigation-submenu'),
			// ...and which is only ever available there.
			submenuParent: window.wp.blocks.getBlockType('core/navigation-submenu').parent,
		}));

		expect(result.inserterVariations).toContain('soli/mega-panel');
		expect(result.navigationAllows).toBe(true);
		expect(result.submenuParent).toEqual(['core/navigation']);
	});

	test('the mega panel variation carries a usable default panel layout', async ({ page }) => {
		// createBlock throws on an unregistered block name, so building the whole
		// template proves every block the variation reaches for really exists.
		const layout = await page.evaluate(() => {
			const { createBlock, createBlocksFromInnerBlocksTemplate, getBlockVariations } =
				window.wp.blocks;

			const variation = getBlockVariations('core/navigation-submenu').find(
				(candidate) => candidate.name === 'soli/mega-panel'
			);

			const block = createBlock(
				'core/navigation-submenu',
				variation.attributes,
				createBlocksFromInnerBlocksTemplate(variation.innerBlocks)
			);

			const describe = (node) => ({
				name: node.name,
				children: node.innerBlocks.map(describe),
			});

			return describe(block);
		});

		expect(layout.name).toBe('core/navigation-submenu');

		const group = layout.children[0];
		expect(group.name).toBe('core/group');

		const columns = group.children[0];
		expect(columns.name).toBe('core/columns');
		expect(columns.children.map((column) => column.name)).toEqual([
			'core/column',
			'core/column',
			'core/column',
		]);

		// Every column is pre-filled with a heading and a paragraph to edit.
		for (const column of columns.children) {
			expect(column.children.map((child) => child.name)).toEqual([
				'core/heading',
				'core/paragraph',
			]);
		}
	});
});
