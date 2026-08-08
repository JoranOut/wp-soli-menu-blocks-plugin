<?php


/**
 * Registers the block using a `blocks-manifest.php` file, which improves the performance of block type registration.
 * Behind the scenes, it also registers all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
add_action( 'init', function() {
    /**
     * Registers the block(s) metadata from the `blocks-manifest.php` and registers the block type(s)
     * based on the registered block metadata.
     * Added in WordPress 6.8 to simplify the block metadata registration process added in WordPress 6.7.
     *
     * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
     */
    if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
        wp_register_block_types_from_metadata_collection( SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . '/build', SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . '/build/blocks-manifest.php' );
        return;
    }

    /**
     * Registers the block(s) metadata from the `blocks-manifest.php` file.
     * Added to WordPress 6.7 to improve the performance of block type registration.
     *
     * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
     */
    if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
        wp_register_block_metadata_collection( SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . '/build', SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . '/build/blocks-manifest.php' );
    }
    /**
     * Registers the block type(s) in the `blocks-manifest.php` file.
     *
     * @see https://developer.wordpress.org/reference/functions/register_block_type/
     */
    $manifest_data = require SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . '/build/blocks-manifest.php';
    foreach ( array_keys( $manifest_data ) as $block_type ) {
        register_block_type( SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH . "/build/{$block_type}" );
    }
});

// Enqueue front-end CSS for the submenu panel variation. as it is a variation of
// core/navigation-submenu the CSS needs to be enqueued manually.
add_filter('render_block', function ($block_content, $block) {

    if (empty($block['blockName']) || 'core/navigation-submenu' !== $block['blockName']) {
        return $block_content;
    }

    // Only enqueue if this specific instance is your variation (class present).
    if (false === strpos($block_content, 'is-soli-mega-panel')) {
        return $block_content;
    }

    $rel_css = 'build/mega-panel/style-index.css';
    $css_path = SOLI_MENU_BLOCKS__PLUGIN_DIR_URL . $rel_css;
    $css_url = SOLI_MENU_BLOCKS__PLUGIN_DIR_URL . $rel_css;

    wp_enqueue_style(
        'soli-mega-panel',
        $css_url,
        array(),
        file_exists($css_path) ? filemtime($css_path) : null
    );

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
