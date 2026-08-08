/**
 * Use this file for JavaScript code that you want to run in the front-end 
 * on posts/pages that contain this block.
 *
 * When this file is defined as the value of the `viewScript` property
 * in `block.json` it will be enqueued on the front end of the site.
 *
 * Example:
 *
 * ```js
 * {
 *   "viewScript": "file:./view.js"
 * }
 * ```
 *
 * If you're not making any changes to this file because your project doesn't need any 
 * JavaScript running in the front-end, then you should delete this file and remove 
 * the `viewScript` property from `block.json`. 
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script
 */

// when the user clicks anywhere inside the block, trigger a click on the login/logout link
document.addEventListener('click', (event) => {
    const wrapper = event.target.closest('.wp-block-soli-image-login');
    if (!wrapper) return;

    const link = wrapper.querySelector('.wp-block-loginout > a');
    if (!link) return;

    // If user clicked the link itself, do nothing (avoid double-trigger).
    if (event.target.closest('.wp-block-loginout > a')) return;

    link.click();
});
