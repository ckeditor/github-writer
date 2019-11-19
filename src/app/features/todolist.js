/**
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../feature';

export default class TodoList extends Feature {
	constructor( editor ) {
		super( 'todolist', editor );

		this.gitHubName = 'task-list';
	}

	execute() {
		this.editor.editor.execute( 'todoList' );
	}
}
