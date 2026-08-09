/**
 * Front-end positioning for the Soli Mega Panel.
 *
 * The panel is a `<ul>` inside a navigation `<li>`, so pure CSS can only place it
 * relative to that `<li>`. Stretching it edge to edge then needs 100vw plus a
 * translate, which breaks on scrollbars, transformed ancestors and any container
 * that clips overflow. Instead we take the panel out of the flow entirely with
 * `position: fixed` and hand CSS two measurements:
 *
 *   --soli-mega-panel-top     viewport offset of the bottom of the menu item
 *   --soli-mega-panel-bridge  transparent padding that bridges the gap between
 *                             that item and the bottom of the header
 *
 * The panel starts at the item's own bottom edge so the `:hover` chain stays
 * unbroken, while its padding pushes the visible content down to the header
 * edge. Horizontal placement is then just `left: 0; right: 0`.
 */

const ITEM_SELECTOR = '.wp-block-navigation-item.is-soli-mega-panel';
const PANEL_SELECTOR = ':scope > .wp-block-navigation__submenu-container';
const POSITIONED_CLASS = 'is-soli-mega-panel-positioned';

/* Matches the breakpoint in style.scss where the panel is hidden. */
const MIN_VIEWPORT_WIDTH = 601;

function reset( panel ) {
	panel.classList.remove( POSITIONED_CLASS );
	panel.style.removeProperty( '--soli-mega-panel-top' );
	panel.style.removeProperty( '--soli-mega-panel-bridge' );
}

function positionItem( item ) {
	const panel = item.querySelector( PANEL_SELECTOR );

	if ( ! panel ) {
		return;
	}

	// Inside the mobile overlay the navigation stacks vertically and core
	// handles the layout; a fixed panel would float over it.
	const inOpenOverlay = item.closest(
		'.wp-block-navigation__responsive-container.is-menu-open'
	);

	if ( inOpenOverlay || window.innerWidth < MIN_VIEWPORT_WIDTH ) {
		reset( panel );
		return;
	}

	const itemBottom = item.getBoundingClientRect().bottom;

	// Align the visible panel with the bottom of the header when there is one,
	// so it reads as one band rather than as a box hanging off a single item.
	const anchor = item.closest( 'header' ) || item;
	const anchorBottom = anchor.getBoundingClientRect().bottom;

	panel.style.setProperty(
		'--soli-mega-panel-top',
		`${ Math.round( itemBottom ) }px`
	);
	panel.style.setProperty(
		'--soli-mega-panel-bridge',
		`${ Math.max( 0, Math.round( anchorBottom - itemBottom ) ) }px`
	);
	panel.classList.add( POSITIONED_CLASS );
}

function positionAll() {
	document.querySelectorAll( ITEM_SELECTOR ).forEach( positionItem );
}

let frame = null;

function schedule() {
	if ( frame !== null ) {
		return;
	}

	frame = window.requestAnimationFrame( () => {
		frame = null;
		positionAll();
	} );
}

function init() {
	const items = document.querySelectorAll( ITEM_SELECTOR );

	if ( ! items.length ) {
		return;
	}

	positionAll();

	// A sticky header moves under the viewport while scrolling, and the item's
	// own offset changes with it, so both axes need re-measuring.
	window.addEventListener( 'scroll', schedule, { passive: true } );
	window.addEventListener( 'resize', schedule );

	// Measure right before the panel becomes visible, so the first frame of a
	// hover or keyboard focus is already in the right place.
	items.forEach( ( item ) => {
		item.addEventListener( 'pointerenter', () => positionItem( item ) );
		item.addEventListener( 'focusin', () => positionItem( item ) );
	} );

	if ( window.ResizeObserver ) {
		const observer = new window.ResizeObserver( schedule );

		// Late-loading webfonts or a logo image change the header height after
		// the first measurement.
		items.forEach( ( item ) => {
			observer.observe( item.closest( 'header' ) || item );
		} );
	}

	// Opening or closing the mobile overlay flips which layout applies.
	document
		.querySelectorAll( '.wp-block-navigation__responsive-container' )
		.forEach( ( container ) => {
			if ( ! window.MutationObserver ) {
				return;
			}

			new window.MutationObserver( schedule ).observe( container, {
				attributes: true,
				attributeFilter: [ 'class' ],
			} );
		} );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
