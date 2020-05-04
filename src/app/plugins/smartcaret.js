/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import priorities from '@ckeditor/ckeditor5-utils/src/priorities';

/**
 * Changes the gravity of the selection to match the direction of the left/right arrow keys when pressed.
 * It additionally makes it possible to escape from inline attributes at the beginning/end of content.
 */
export default class SmartCaret extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const selection = editor.model.document.selection;
		let overrideId;
		let selectionChangeGravity;

		this.listenTo( editor.editing.view.document, 'keydown', ( evt, data ) => {
			// We don't handle modifier keys.
			if ( data.shiftKey || data.altKey || data.ctrlKey ) {
				return;
			}

			const arrowRightPressed = data.keyCode === keyCodes.arrowright;
			const arrowLeftPressed = data.keyCode === keyCodes.arrowleft;

			// When neither left or right arrow has been pressed then do noting.
			if ( !arrowRightPressed && !arrowLeftPressed ) {
				return;
			}

			// Define the expected gravity.
			let gravity = arrowRightPressed ? 'left' : 'right';

			// Save a reference to the gravity we want to have once the selection has finally changed.
			// This will eventually revert the inversion made in the lines that follow.
			selectionChangeGravity = gravity;

			// If we're already at the beginning/end of the text, we'll invert the gravity so we can escape from
			// inline attributes if the selection position will not change (beginning/end of document).
			if ( selection.isCollapsed ) {
				const position = selection.getFirstPosition();
				if ( arrowRightPressed && position.isAtEnd ) {
					gravity = 'right';
				} else if ( arrowLeftPressed && position.isAtStart ) {
					gravity = 'left';
				}
			}

			setGravity( gravity );
		}, {
			priority: priorities.get( 'high' ) + 10
		} );

		// Restore gravity once any selection is made:
		//   - If one of the arrow keys was used, restore it to the gravity connected to that key.
		//     - One of the nice effects of the above is that no restoration will happen if the selection didn't change.
		//   - Or restore it to the default gravity in case of a different selection change (e.g. user click).
		this.listenTo( selection, 'change:range', () => {
			setGravity( selectionChangeGravity || 'default' );
			selectionChangeGravity = null;
		} );

		function setGravity( gravity ) {
			const position = selection.getFirstPosition();

			editor.model.enqueueChange( writer => {
				if ( gravity === 'right' ) {
					if ( !overrideId ) {
						overrideId = writer.overrideSelectionGravity();
					}

					// Fix the selection when before a soft break.
					if ( position.nodeAfter && position.nodeAfter.name === 'softBreak' ) {
						removeAllAttributes();
					}
				} else {
					if ( overrideId ) {
						writer.restoreSelectionGravity( overrideId );
						overrideId = null;
					}

					// Undo the default behavior of DocumentSelection which always gravitate to the right
					// when at the beginning of the parent element.
					// Fix the selection when after a soft break.
					if ( gravity === 'left' ) {
						if ( position.isAtStart || ( position.nodeBefore && position.nodeBefore.name === 'softBreak' ) ) {
							removeAllAttributes();
						}
					}
				}

				function removeAllAttributes() {
					writer.removeSelectionAttribute( selection.getAttributeKeys() );
				}
			} );
		}
	}
}
