<?php
// Template context provides: $attributes, $content, $block.

$link_type = isset( $attributes['linkType'] ) ? (string) $attributes['linkType'] : 'page';
$post_type = isset( $attributes['postType'] ) ? (string) $attributes['postType'] : 'page';
$post_id   = isset( $attributes['postId'] ) ? (int) $attributes['postId'] : 0;
$url       = isset( $attributes['url'] ) ? (string) $attributes['url'] : '';
$label     = isset( $attributes['label'] ) ? (string) $attributes['label'] : '';
$new_tab   = ! empty( $attributes['opensInNewTab'] );

$is_editor_preview = is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST );

$href  = '';
$title = '';

if ( $link_type === 'custom' ) {
    $href  = $url;
    $title = $label;
} else {
    // Resolve post/page link from ID.
    if ( $post_id > 0 ) {
        $post = get_post( $post_id );
        if ( $post && $post->post_status === 'publish' && $post->post_type === $post_type ) {
            $href  = get_permalink( $post_id );
            $title = get_the_title( $post_id );
        }
    }

    // Label preference: explicit label overrides resolved title.
    if ( $label !== '' ) {
        $title = $label;
    }
}

if ( $href === '' ) {
    if ( $is_editor_preview ) : ?>
        <div <?php echo get_block_wrapper_attributes( array( 'class' => 'soli-menu-link is-empty' ) ); ?>>
            <?php echo esc_html__( 'Select a link target.', 'soli' ); ?>
        </div>
    <?php
    endif;
    return;
}

if ( $title === '' ) {
    $title = __( 'Link', 'soli' );
}

$target = $new_tab ? '_blank' : '';
$rel    = $new_tab ? 'noopener noreferrer' : '';

?>
    <div <?php echo get_block_wrapper_attributes( array( 'class' => 'soli-menu-link' ) ); ?>>
        <?php if ($attributes['tagName'] == 'h3') : echo '<h3>'; endif; ?>
        <a
            href="<?php echo esc_url( $href ); ?>"
            <?php if ( $target ) : ?>target="<?php echo esc_attr( $target ); ?>"<?php endif; ?>
            <?php if ( $rel ) : ?>rel="<?php echo esc_attr( $rel ); ?>"<?php endif; ?>
        >
            <?php if ($attributes['tagName'] == 'b') : echo '<b>'; endif; ?>
                <?php echo esc_html( $title ); ?>
            <?php if ($attributes['tagName'] == 'b') : echo '</b>'; endif; ?>
        </a>
        <?php if ($attributes['tagName'] == 'b') : echo '</h3>'; endif; ?>
    </div>
<?php
