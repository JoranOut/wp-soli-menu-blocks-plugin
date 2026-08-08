<?php
// $attributes, $content, and $block are available in this template. :contentReference[oaicite:1]{index=1}

$parent_id = isset( $attributes['parentId'] ) ? (int) $attributes['parentId'] : 0;
$link_to   = isset( $attributes['linkToPage'] ) ? (bool) $attributes['linkToPage'] : true;

// When rendering via ServerSideRender, the request is a REST request, not "admin".
// So use REST_REQUEST to show an editor-friendly placeholder.
$is_editor_preview = is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST );

if ( $parent_id <= 0 || get_post_type( $parent_id ) !== 'page' ) {
    if ( $is_editor_preview ) : ?>
        <div <?php echo get_block_wrapper_attributes( array( 'class' => 'soli-random-descendant-card is-empty' ) ); ?>>
            Select a parent page in the block settings.
        </div>
    <?php endif;
    return;
}

$descendants = get_pages( array(
        'child_of'    => $parent_id,
        'sort_column' => 'menu_order,post_title',
        'sort_order'  => 'ASC',
        'post_status' => 'publish',
) );

if ( empty( $descendants ) ) {
    if ( $is_editor_preview ) : ?>
        <div <?php echo get_block_wrapper_attributes( array( 'class' => 'soli-random-descendant-card is-empty' ) ); ?>>
            No published descendant pages found for the selected parent.
        </div>
    <?php endif;
    return;
}

$random_page = $descendants[ array_rand( $descendants ) ];
$page_id     = (int) $random_page->ID;

$title = get_the_title( $page_id );
$url   = get_permalink( $page_id );

$image_html = has_post_thumbnail( $page_id )
        ? get_the_post_thumbnail(
                $page_id,
                'large',
                array(
                        'class'   => 'soli-random-descendant-card__image',
                        'loading' => 'lazy',
                )
        )
        : '';
?>

<div <?php echo get_block_wrapper_attributes( array( 'class' => 'soli-random-descendant-card' ) ); ?>>
    <?php if ( $link_to ) : ?>
    <a class="soli-random-descendant-card__link" href="<?php echo esc_url( $url ); ?>">
        <?php endif; ?>

        <?php if ( $image_html ) : ?>
            <div class="soli-random-descendant-card__media">
                <?php echo $image_html; ?>
            </div>
        <?php endif; ?>

        <p class="soli-random-descendant-card__title">
            <?php echo esc_html( $title ); ?>
        </p>

        <?php if ( $link_to ) : ?>
    </a>
<?php endif; ?>
</div>
