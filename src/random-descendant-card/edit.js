/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __ } from '@wordpress/i18n';

/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
import { InspectorControls } from "@wordpress/block-editor";
import { PanelBody, ToggleControl, ComboboxControl, Spinner } from "@wordpress/components";
import { useSelect } from "@wordpress/data";
import ServerSideRender from "@wordpress/server-side-render";

export default function Edit({ attributes, setAttributes }) {
    const { parentId, linkToPage } = attributes;

    // Fetch a reasonable set of pages for the selector.
    // For very large sites, you’ll likely want a search-as-you-type pattern.
    const { pages, isResolving } = useSelect((select) => {
        const core = select("core");
        const query = { per_page: 100, orderby: "title", order: "asc" };

        return {
            pages: core.getEntityRecords("postType", "page", query),
            isResolving: core.isResolving("getEntityRecords", ["postType", "page", query]),
        };
    }, []);

    const options =
        (pages || []).map((p) => ({
            label: p.title?.rendered ? decodeEntities(p.title.rendered) : `#${p.id}`,
            value: p.id,
        })) || [];

    return (
        <>
            <InspectorControls>
                <PanelBody title={__("Random Subpage Card", "random-descendant-card")}>
                    {isResolving && !pages ? <Spinner /> : null}

                    <ComboboxControl
                        label={__("Parent page", "random-descendant-card")}
                        help={__("Pick a page; the block will display a random descendant of it.", "random-descendant-card")}
                        value={parentId || 0}
                        options={options}
                        onChange={(newValue) => setAttributes({ parentId: Number(newValue) || 0 })}
                        allowReset={true}
                        onFilterValueChange={() => {}}
                    />

                    <ToggleControl
                        label={__("Link to selected page", "random-descendant-card")}
                        checked={!!linkToPage}
                        onChange={(v) => setAttributes({ linkToPage: !!v })}
                    />
                </PanelBody>
            </InspectorControls>

            <div className="soli-random-descendant-card__preview">
                <ServerSideRender
                    block="soli/random-descendant-card"
                    attributes={attributes}
                />
            </div>
        </>
    );
}

// Minimal HTML entity decode for titles
function decodeEntities(str) {
    const txt = document.createElement("textarea");
    txt.innerHTML = str;
    return txt.value;
}
