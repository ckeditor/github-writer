/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import App from '../app';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import env from '@ckeditor/ckeditor5-utils/src/env';

const utils = {
	/**
	 *Fixes the toolbar buttons label so they look exactly like the original GH ones (minor detail).
	 *
	 * @param {ToolbarView} toolbar The toolbar to be tweaked.
	 * @param  {String} tooltipPosition='n' The tooltip position: 'n' (north, top) or 's' (south, bottom).
	 */
	toolbarItemsPostfix( toolbar, tooltipPosition = 'n' ) {
		// Postfix is possible only in pages type "comments" (not "wiki").
		if ( App.page.type !== 'comments' ) {
			return;
		}

		const ctrlCmd = env.isMac ? 'cmd' : 'ctrl';

		// The list of labels to be replaced. The keys are the default CKEditor labels.
		const labels = {
			// Not available in GH but changed to match the GH language style (more verbose).
			'Keyboard shortcut': `Add keyboard shortcut <${ ctrlCmd }+alt-k>`,
			'Strikethrough': 'Add strikethrough text',
			'Horizontal line': 'Insert a horizontal line',
			'Insert image': 'Insert an image',
			'Insert table': 'Insert a table',
			'Remove Format': 'Remove text formatting'
		};

		// Add the original labels used in GH.
		Object.entries( {
			'Bold': 'md-bold',
			'Italic': 'md-italic',
			'Block quote': 'md-quote',
			'Code': 'md-code',
			'Link': 'md-link',
			'Bulleted List': 'md-unordered-list',
			'Numbered List': 'md-ordered-list',
			'To-do List': 'md-task-list'
		} ).forEach( ( [ originalLabel, query ] ) => {
			const element = document.querySelector( query );
			const ghLabel = element && element.getAttribute( 'aria-label' );

			if ( ghLabel ) {
				labels[ originalLabel ] = ghLabel;
			}
		} );

		const items = Array.from( toolbar.items );

		items.forEach( item => {
			// Some items, like Drop Downs and File Dialog, are containers for their buttons. Take the inner button then.
			if ( item.buttonView ) {
				item = item.buttonView;
			}

			if ( item instanceof ButtonView ) {
				const itemLabel = labels[ item.label ] || item.label;

				// Disable the CKEditor tooltip as we'll use the GH lib for that.
				item.set( 'tooltip', false );

				// Items inside toolbars are always rendered (item.isRendered) so we touch the DOM element for fixes.
				{
					// Make the necessary changes for the GH tooltip to work.
					// Set the text visible in the tooltip.
					item.element.setAttribute( 'aria-label', itemLabel );
					// Enable tooltips.
					item.set( 'class', ( ( item.class || '' ) + ' tooltipped tooltipped-' + tooltipPosition ).trim() );
				}
			}
		} );
	},

	setupAutoResize( editor ) {
		const container = editor.getSizeContainer();

		if ( container ) {
			container.classList.add( 'github-writer-size-container' );
			setupSize();
		}

		function setupSize() {
			// Set minimum height = current height.
			const min = container.offsetHeight;
			container.style.minHeight = min + 'px';

			// GH Stickies.
			const stickyHeader = document.querySelector( '.gh-header-sticky.js-sticky' );
			const stickyNotification = document.querySelector( '.js-notification-shelf.js-sticky' );
			const stickyPrToolbar = document.querySelector( '.pr-toolbar.js-sticky' );
			const stickyFileHeader = document.querySelector( '.js-file-header.sticky-file-header' );

			const setMaxHeight = () => {
				// Take the viewport height.
				let max = document.documentElement.clientHeight;

				// Minus GH stickies.
				{
					if ( stickyHeader ) {
						const height = stickyHeader.offsetHeight;
						height > 1 && ( max -= height );
					}
					if ( stickyNotification ) {
						max -= stickyNotification.offsetHeight;
					}
					if ( stickyFileHeader ) {
						max -= stickyFileHeader.offsetHeight;
					}
					if ( stickyPrToolbar ) {
						max -= stickyPrToolbar.offsetHeight;
					}
				}

				// Minus margin
				max -= 60;

				// Max must be at least min.
				max = Math.max( min, max );

				container.style.maxHeight = max + 'px';
			};

			setMaxHeight();

			// Observe the GH stickies show/hide.
			if ( stickyHeader || stickyNotification || stickyFileHeader ) {
				const observer = new ResizeObserver( setMaxHeight );
				editor.domManipulator.addRollbackOperation( () => observer.disconnect() );

				stickyHeader && observer.observe( stickyHeader );
				stickyNotification && observer.observe( stickyNotification );
			}

			// Observe window resize.
			editor.domManipulator.addEventListener( window, 'resize', () => {
				setMaxHeight();
			} );
		}
	}
};

export default utils;
