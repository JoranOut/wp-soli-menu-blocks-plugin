/**
 * The mega panel is a variation of core/navigation-submenu, not a block type of
 * its own. Core already renders the submenu, its label and its inner blocks; all
 * this file adds is a preset panel layout and the is-soli-mega-panel class that
 * inc/blocks.php keys the front-end stylesheet off.
 *
 * Because there is no block type, `block.json` is never registered server-side
 * (see soli_menu_blocks_variation_only_dirs() in inc/blocks.php) and this script
 * is enqueued by hand on enqueue_block_editor_assets.
 */

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * All files containing `style` keyword are bundled together. The code used
 * gets applied both to the front of your site and to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './style.scss';

import metadata from './block.json';

import { registerBlockVariation } from '@wordpress/blocks';

registerBlockVariation('core/navigation-submenu', {
	name: metadata.name,
	title: 'Mega Panel',
	description: 'A navigation submenu with a large panel that can contain blocks (columns, groups, etc.).',
	icon: 'screenoptions',
	scope: ['inserter'],

	// Make it easy to find in the Navigation inserter.
	keywords: ['mega', 'panel', 'dropdown', 'submenu'],

	attributes: {
		// This becomes the submenu label in the UI.
		label: 'Menu',

		// Add a class to target styles. Users can still add their own extra classes.
		className: 'is-soli-mega-panel'
	},

	// Provide a sensible default panel layout.
	innerBlocks: [
        [
			'core/group',
			{
				className: 'soli-mega-panel__content',
				layout: { type: 'constrained' }
			},
			[
				[
					'core/columns',
					{ isStackedOnMobile: true },
					[
						['core/column', {}, [['core/heading', { level: 3, content: 'Kop 1' }], ['core/paragraph', { content: 'Voeg hier links of content toe.' }]]],
						['core/column', {}, [['core/heading', { level: 3, content: 'Kop 2' }], ['core/paragraph', { content: 'Voeg hier links of content toe.' }]]],
						['core/column', {}, [['core/heading', { level: 3, content: 'Kop 3' }], ['core/paragraph', { content: 'Voeg hier links of content toe.' }]]]
					]
				]
			]
		]
	],

	// Recognize an existing block as this variation when it has the class.
	isActive: (blockAttributes) =>
		(blockAttributes?.className || '').split(' ').includes('is-soli-mega-panel'),
});
