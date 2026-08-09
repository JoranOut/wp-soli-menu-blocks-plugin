<?php

/**
 * Block directories in `build/` that hold the assets of a block *variation*
 * rather than a block type of its own.
 *
 * `soli/mega-panel` is a variation of `core/navigation-submenu`, registered in
 * the editor by `src/mega-panel/index.js`. Its `block.json` exists only so that
 * wp-scripts compiles the variation's editor script and front-end stylesheet;
 * handing it to `register_block_type()` as well would create a server-side block
 * type with no editor counterpart, which is exactly the state this list avoids:
 * `getBlockType( 'soli/mega-panel' )` was `undefined`, so
 * `createBlock( 'soli/mega-panel' )` fell back to `core/missing` and serialized to
 * an empty string. Nothing could ever insert it.
 *
 * Both of its assets are enqueued by hand further down this file.
 */
function soli_menu_blocks_variation_only_dirs() {
    return array( 'mega-panel' );
}

/**
 * Registers the block types using a `blocks-manifest.php` file, which improves the
 * performance of block type registration. Behind the scenes, it also registers all
 * assets so they can be enqueued through the block editor in the corresponding context.
 *
 * The metadata collection is registered separately from the block types themselves so
 * that variation-only directories can be skipped; `wp_register_block_types_from_metadata_collection()`
 * registers every entry in the manifest and offers no way to leave one out.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
add_action( 'init', function() {
    $build_dir = SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . 'build';
    $manifest  = $build_dir . '/blocks-manifest.php';

    if ( ! file_exists( $manifest ) ) {
        return;
    }

    /**
     * Registers the block(s) metadata from the `blocks-manifest.php` file.
     * Added to WordPress 6.7 to improve the performance of block type registration.
     *
     * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
     */
    if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
        wp_register_block_metadata_collection( $build_dir, $manifest );
    }

    /**
     * Registers the block type(s) in the `blocks-manifest.php` file.
     *
     * @see https://developer.wordpress.org/reference/functions/register_block_type/
     */
    $manifest_data   = require $manifest;
    $variation_only  = soli_menu_blocks_variation_only_dirs();

    foreach ( array_keys( $manifest_data ) as $block_dir ) {
        if ( in_array( $block_dir, $variation_only, true ) ) {
            continue;
        }

        register_block_type( "{$build_dir}/{$block_dir}" );
    }
});

/**
 * Enqueues the mega panel stylesheet.
 *
 * Versioned by the stylesheet's own modification time so that a rebuilt panel
 * reaches browsers that already cached the previous one. The version is computed
 * from the file system path; passing the *URL* to `file_exists()` always fails,
 * which silently turned the version into `null` and dropped cache busting
 * altogether.
 */
function soli_menu_blocks_enqueue_mega_panel_style() {
    $relative_path = 'build/mega-panel/style-index.css';
    $css_path      = SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . $relative_path;
    $css_url       = SOLI_MENU_BLOCKS__PLUGIN_DIR_URL . $relative_path;

    wp_enqueue_style(
        'soli-mega-panel',
        $css_url,
        array(),
        file_exists( $css_path ) ? filemtime( $css_path ) : SOLI_MENU_BLOCKS__PLUGIN_VERSION
    );
}

/**
 * Loads the mega panel variation in the editor.
 *
 * A block variation has no block type of its own, so nothing enqueues its script
 * automatically the way `block.json`'s `editorScript` would. The stylesheet is
 * loaded alongside it so the panel looks the same in the editor as it does on the
 * front end.
 */
add_action( 'enqueue_block_editor_assets', function() {
    $asset_file = SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . 'build/mega-panel/index.asset.php';

    if ( ! file_exists( $asset_file ) ) {
        return;
    }

    $asset = require $asset_file;

    wp_enqueue_script(
        'soli-mega-panel-editor',
        SOLI_MENU_BLOCKS__PLUGIN_DIR_URL . 'build/mega-panel/index.js',
        $asset['dependencies'],
        $asset['version'],
        true
    );

    soli_menu_blocks_enqueue_mega_panel_style();
});

// Enqueue front-end CSS for the submenu panel variation. As it is a variation of
// core/navigation-submenu the CSS needs to be enqueued manually: a variation
// cannot declare its own styles in block.json.
add_filter('render_block', function ($block_content, $block) {

    if (empty($block['blockName']) || 'core/navigation-submenu' !== $block['blockName']) {
        return $block_content;
    }

    // Only enqueue if this specific instance is your variation (class present).
    if (false === strpos($block_content, 'is-soli-mega-panel')) {
        return $block_content;
    }

    soli_menu_blocks_enqueue_mega_panel_style();

    return $block_content;

}, 10, 2);

// Allow image-login block inside the Navigation block inserter.
add_filter( 'block_type_metadata', function ( $metadata ) {
    if ( isset( $metadata['name'] ) && 'core/navigation' === $metadata['name'] ) {
        $metadata['allowedBlocks'] = $metadata['allowedBlocks'] ?? array();
        $metadata['allowedBlocks'][] = 'soli/image-login';
    }
    return $metadata;
} );
