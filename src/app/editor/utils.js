/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const utils = {
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
