/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const GitHubBrowser = require( './githubbrowser' );

let ctrlCmdKey;

const util = {
	/**
	 * Wait for a dialog to show up and perform the desired confirmation option in it.
	 *
	 * The returned value is an object with methods that specify the desired dialog action:
	 *  - util.waitForDialog( page ).accept() : confirms the dialog (ok).
	 *
	 * The action method returns a promise which resolves when the dialog is displayed and the action is executed.
	 *
	 * Dialogs are usually triggered by actions that need to be waited (e.g. click). Therefore, the proper
	 * way to use this method is as follows:
	 *
	 * 		Promise.all( [
	 * 			util.waitForDialog( page ).accept(),
	 * 			page.browserPage.click( `some-selector` )
	 * 		] );
	 *
	 * @return {{accept(): Promise<unknown>}}
	 */
	waitForDialog() {
		const promise = GitHubBrowser.getPage().then( browserPage => {
			return new Promise( resolve => {
				browserPage.once( 'dialog', resolve );
			} );
		} );

		return {
			accept() {
				return promise.then( dialog => dialog.accept() );
			}
		};
	},

	/**
	 * Types text in the specified element.
	 *
	 * The text can have keystrokes included inside brackets. Examples:
	 *  - [Enter]
	 *  - [Ctrl+ArrowRight]
	 *  - [Ctrl+Shift+Alt+Z]
	 *  - [CtrlCmd+Space]
	 *
	 *  The "CtrlCmd" modified sends the `command` (meta) key on mac and the `control` key in other OSs.
	 *
	 * @param targetElement {ElementHandle} The element to receive the typing.
	 * @param texts {...String} The texts to be typed.
	 * @return {Promise<void>}
	 */
	async type( targetElement, ...texts ) {
		const browserPage = await GitHubBrowser.getPage();

		if ( !ctrlCmdKey ) {
			ctrlCmdKey = await getCtrlCmdKey();
		}

		const parts = texts.join( '' ).split( /(\[[^\]]+])/g );

		for ( let i = 0; i < parts.length; i++ ) {
			const part = parts[ i ];
			if ( part ) {
				const isKeystroke = /^\[[^\]]+]$/.test( part );
				if ( isKeystroke ) {
					let [ , modifiers, key ] = part.match( /^\[(?:(.+)\+)?([^+\]]+)]$/ );
					modifiers = modifiers ? modifiers.split( '+' ) : [];

					modifiers = modifiers.map( key => key
						.replace( /Shift/i, 'Shift' )
						.replace( /Alt/i, 'Alt' )
						.replace( /CtrlCmd/i, ctrlCmdKey )
						.replace( /Ctrl/i, 'Control' )
					);

					for ( let i = 0; i < modifiers.length; i++ ) {
						browserPage.keyboard.down( modifiers[ i ] );
					}

					await targetElement.press( key );

					for ( let i = 0; i < modifiers.length; i++ ) {
						browserPage.keyboard.up( modifiers[ i ] );
					}
				} else {
					await targetElement.type( part );
				}
			}
		}

		async function getCtrlCmdKey() {
			return await browserPage.evaluate( () => /Mac/i.test( navigator.platform ) ? 'Meta' : 'Control' );
		}
	}
};

module.exports = util;
