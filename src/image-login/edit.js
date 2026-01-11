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
import { InspectorControls, InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';

/**
 * Lets webpack process CSS, SASS or SCSS files referenced in JavaScript files.
 * Those files can contain any CSS code that gets applied to the editor.
 *
 * @see https://www.npmjs.com/package/@wordpress/scripts#using-css
 */
import './editor.scss';

const TEMPLATE = [
    [
        'core/image',
        {
            sizeSlug: 'thumbnail',
            width: 0,
            height: 30,
            scale: 'contain',
            linkDestination: 'none',
            showCaption: false,
            lock: {
                move: true,
                remove: true,
            }
        },
    ],
    [
        'core/loginout',
        {
            displayLoginAsForm: false,
        },
    ],
];

/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#edit
 *
 * @return {Element} Element to render.
 */
export default function Edit({ attributes, setAttributes }) {
    const { hideOnMobile, hideOnDesktop, hideImage } = attributes;

    const blockProps = useBlockProps.save({
        className: [
            'wp-block-soli-image-login',
            hideOnMobile ? 'is-hidden-mobile' : '',
            hideOnDesktop ? 'is-hidden-desktop' : '',
            hideImage ? 'is-hidden-image' : ''
        ].join(' '),
    });

    return (
        <>
            <InspectorControls>
                <PanelBody title={__('Login Panel', 'soli')} initialOpen>
                    <ToggleControl
                        label={__('Hide on mobile', 'soli')}
                        checked={!!hideOnMobile}
                        onChange={(v) => setAttributes({ hideOnMobile: !!v })}
                    />
                    <ToggleControl
                        label={__('Hide on Desktop', 'soli')}
                        checked={!!hideOnDesktop}
                        onChange={(v) => setAttributes({ hideOnDesktop: !!v })}
                    />
                    <ToggleControl
                        label={__('Hide image', 'soli')}
                        checked={!!hideImage}
                        onChange={(v) => setAttributes({ hideImage: !!v })}
                    />
                </PanelBody>
            </InspectorControls>

            <div {...blockProps}>
                <InnerBlocks
                    template={TEMPLATE}
                    templateLock={true}
                />
            </div>
        </>
    );
}
