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
import { InspectorControls, useBlockProps, URLInput } from '@wordpress/block-editor';

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
import { PanelBody, SelectControl, ComboboxControl, TextControl, ToggleControl, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

export default function Edit({ attributes, setAttributes }) {
    const { linkType, postId, url, label, opensInNewTab } = attributes;

    const effectivePostType = linkType === 'post' ? 'post' : 'page';

    const { records, isResolving, selectedRecord } = useSelect(
        (select) => {
            const core = select('core');
            const query = { per_page: 50, orderby: 'title', order: 'asc', _fields: 'id,title' };

            return {
                records: linkType !== 'custom' ? core.getEntityRecords('postType', effectivePostType, query) : [],
                isResolving: linkType !== 'custom'
                    ? core.isResolving('getEntityRecords', ['postType', effectivePostType, query])
                    : false,
                selectedRecord:
                    linkType !== 'custom' && postId > 0
                        ? core.getEntityRecord('postType', effectivePostType, postId)
                        : null,
            };
        },
        [linkType, effectivePostType, postId]
    );

    const TAG_OPTIONS = [
        { value: 'a', label: '<a> (link)' },
        { value: 'b', label: '<b> (bold label)' },
        { value: 'h3', label: '<h3> (heading)' },
    ];

    const options =
        (records || []).map((r) => ({
            value: r.id,
            label: r.title?.rendered ? decodeEntities(r.title.rendered) : `#${r.id}`,
        })) || [];

    const previewLabel =
        label ||
        (selectedRecord?.title?.rendered ? decodeEntities(selectedRecord.title.rendered) : '') ||
        __('Link', 'soli');

    const blockProps = useBlockProps({ className: 'soli-menu-link' });

    const previewHTML = {
        a: <a href="#">{previewLabel}</a>,
        b: <a href="#"><b>{previewLabel}</b></a>,
        h3: <h3><a href="#">{previewLabel}</a></h3>,
    };

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Link', 'soli')}>
                    <SelectControl
                        label={__('Link type', 'soli')}
                        value={linkType}
                        options={[
                            { label: __('Page', 'soli'), value: 'page' },
                            { label: __('Post', 'soli'), value: 'post' },
                            { label: __('Custom URL', 'soli'), value: 'custom' },
                        ]}
                        onChange={(v) => {
                            if (v === 'custom') {
                                setAttributes({ linkType: 'custom', postType: 'page', postId: 0 });
                            } else {
                                setAttributes({
                                    linkType: v,
                                    postType: v === 'post' ? 'post' : 'page',
                                    postId: 0,
                                });
                            }
                        }}
                    />

                    {linkType !== 'custom' && (
                        <>
                            {isResolving && <Spinner />}

                            <ComboboxControl
                                label={linkType === 'post' ? __('Select post', 'soli') : __('Select page', 'soli')}
                                value={postId || 0}
                                options={options}
                                onChange={(newValue) => {
                                    const nextId = Number(newValue) || 0;
                                    setAttributes({
                                        postType: effectivePostType,
                                        postId: nextId,
                                    });
                                }}
                                allowReset
                            />
                        </>
                    )}

                    {linkType === 'custom' && (
                        <div style={{ marginBottom: '16px' }}>
                            <URLInput
                                label={__('URL', 'soli')}
                                value={url}
                                onChange={(nextUrl) => setAttributes({ url: nextUrl || '' })}
                            />
                        </div>
                    )}

                    <TextControl
                        label={__('Label (optional)', 'soli')}
                        value={label}
                        placeholder={previewLabel}
                        onChange={(v) => setAttributes({ label: v })}
                    />

                    <ToggleControl
                        label={__('Open in new tab', 'soli')}
                        checked={!!opensInNewTab}
                        onChange={(v) => setAttributes({ opensInNewTab: !!v })}
                    />

                    <ComboboxControl
                        label="Element"
                        help="Choose how the label is rendered."
                        value={attributes.tagName}
                        options={TAG_OPTIONS}
                        onChange={(next) => setAttributes({ tagName: next || 'a' })}
                        allowReset={false}
                    />
                </PanelBody>
            </InspectorControls>

            {/* Simple preview; real URL is resolved in PHP */}
            <div {...blockProps}>
                {previewHTML[attributes.tagName] ?? previewHTML.a}
            </div>
        </>
    );
}

function decodeEntities(str) {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

