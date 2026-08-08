/**
 * Shared helpers for the Soli Menu Blocks e2e tests.
 */

const { expect } = require('@playwright/test');

/**
 * Every block type this plugin registers in PHP, with the title shown in the editor.
 *
 * Note that soli/mega-panel is the odd one out: PHP registers it as a block type
 * from build/blocks-manifest.php, but the editor side registers it as a *variation*
 * of core/navigation-submenu (see src/mega-panel/index.js), so it is not a
 * JavaScript block type and cannot be created with createBlock().
 */
const BLOCKS = [
	{ name: 'soli/image-login', title: 'Image Login' },
	{ name: 'soli/mega-panel', title: 'Mega Panel' },
	{ name: 'soli/menu-link', title: 'Menu Link' },
	{ name: 'soli/random-descendant-card', title: 'Random Descendant Card' },
];

/** Blocks registered as real block types in the editor. */
const EDITOR_BLOCKS = BLOCKS.filter((block) => block.name !== 'soli/mega-panel');

/** Blocks an author can insert straight into a post. */
const TOP_LEVEL_BLOCKS = EDITOR_BLOCKS;

/**
 * Text that WordPress prints when PHP emits a notice, warning or fatal error.
 * WP_DEBUG_DISPLAY is on in .wp-env.json, so any PHP problem is visible in the
 * HTML and these tests can assert on its absence.
 */
const PHP_ERROR_PATTERNS = [
	'Fatal error',
	'Parse error',
	'Warning:',
	'Notice:',
	'Deprecated:',
	'There has been a critical error on this website',
];

/**
 * Logs in to wp-admin as the wp-env administrator.
 *
 * @param {import('@playwright/test').Page} page
 */
async function loginAsAdmin(page) {
	await page.goto('/wp-login.php');
	await page.fill('#user_login', 'admin');
	await page.fill('#user_pass', 'password');
	await page.click('#wp-submit');
	await page.waitForURL(/wp-admin/);
}

/**
 * Asserts the given HTML contains no PHP error output.
 *
 * @param {string} html
 * @param {string} context Human readable description used in the failure message.
 */
function expectNoPhpErrors(html, context) {
	for (const pattern of PHP_ERROR_PATTERNS) {
		expect(html, `PHP error output ("${pattern}") found in ${context}`).not.toContain(pattern);
	}
}

/**
 * Opens a fresh block editor and waits until the block editor stores are ready.
 *
 * Also switches off the welcome guide, which otherwise renders a modal over the
 * whole editor and swallows clicks.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [postId] Open an existing post instead of creating a new one.
 */
async function openBlockEditor(page, postId) {
	const url = postId ? `/wp-admin/post.php?post=${postId}&action=edit` : '/wp-admin/post-new.php';
	await page.goto(url);

	await page.waitForFunction(
		() => window.wp?.data?.select('core/block-editor') && window.wp?.blocks?.getBlockTypes,
		null,
		{ timeout: 60_000 }
	);

	await page.evaluate(() => {
		const preferences = window.wp.data.dispatch('core/preferences');
		preferences.set('core/edit-post', 'welcomeGuide', false);
		preferences.set('core', 'welcomeGuide', false);
	});

	// Close the modal if it was already on screen before the preference was set.
	const guide = page.locator('.components-modal__frame .edit-post-welcome-guide');
	if (await guide.isVisible().catch(() => false)) {
		await page.locator('.components-modal__header button[aria-label="Close"]').click();
	}

	// The editor canvas is ready once the title field exists.
	await expect(page.locator('.editor-visual-editor, .edit-post-visual-editor')).toBeVisible();
}

/**
 * Creates a page through the REST API using the editor's own authenticated
 * apiFetch, so no application password or nonce plumbing is needed.
 *
 * @param {import('@playwright/test').Page} page  A page already logged in to wp-admin.
 * @param {Object}                          data  REST payload (title, content, status, parent...).
 * @return {Promise<Object>} The created page as returned by the REST API.
 */
async function createPage(page, data) {
	return page.evaluate(
		(payload) =>
			window.wp.apiFetch({
				path: '/wp/v2/pages',
				method: 'POST',
				data: payload,
			}),
		{ status: 'publish', ...data }
	);
}

/**
 * Opens the block inserter and searches for a term.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          term
 */
async function searchInserter(page, term) {
	await page
		.getByRole('button', { name: /^(Block Inserter|Toggle block inserter)$/i })
		.first()
		.click();

	const search = page
		.locator(
			'.block-editor-inserter__search input, .block-editor-inserter__menu input[type="search"]'
		)
		.first();
	await expect(search).toBeVisible();
	await search.fill(term);
}

/**
 * Locator for a block's entry in the inserter results.
 *
 * Gutenberg derives this class from the block name, which makes it a far more
 * precise target than the item's accessible name.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string}                          blockName e.g. soli/image-login
 */
function inserterItem(page, blockName) {
	return page.locator(`.editor-block-list-item-${blockName.replace('/', '-')}`);
}

/**
 * Serializes a block exactly as the editor would save it, so tests can build
 * post content that matches what a real author would produce.
 *
 * @param {import('@playwright/test').Page} page       A page with the block editor loaded.
 * @param {string}                          name       Block name.
 * @param {Object}                          [attributes]
 * @return {Promise<string>} The serialized block markup.
 */
async function serializeBlock(page, name, attributes = {}) {
	return page.evaluate(
		({ blockName, blockAttributes }) =>
			window.wp.blocks.serialize([
				window.wp.blocks.createBlock(blockName, blockAttributes),
			]),
		{ blockName: name, blockAttributes: attributes }
	);
}

module.exports = {
	BLOCKS,
	EDITOR_BLOCKS,
	TOP_LEVEL_BLOCKS,
	loginAsAdmin,
	expectNoPhpErrors,
	openBlockEditor,
	createPage,
	searchInserter,
	inserterItem,
	serializeBlock,
};
