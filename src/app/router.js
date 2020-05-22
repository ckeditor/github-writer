/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* global process */

import App from './app';
import Editor from './editor/editor';

import NewIssueEditor from './features/newissueeditor';
import NewCommentEditor from './features/newcommenteditor';
import CommentEditor from './features/commenteditor';
import NewInlineCommentEditor from './features/newinlinecommenteditor';
import MilestoneEditor from './features/milestoneeditor';
import ReleaseEditor from './features/releaseeditor';
import WikiEditor from './features/wikieditor';
import ReviewEditor from './features/revieweditor';
import CodeLineCommentEditor from './features/codelinecommenteditor';
import NewPullRequestEditor from './features/newpullrequesteditor';
import SavedReplyEditor from './features/savedreplyeditor';

// We just want to ensure that utils is loaded, so we include this import.
// eslint-disable-next-line no-unused-vars
import PageIncompatibilityError from './modules/util';

const routes = {
	'repo_commits': [
		{
			pattern: /\/commit\/.+/,
			features: [ NewCommentEditor, CommentEditor ]
		}
	],
	'repo_issues': [
		{
			pattern: /\/issues\/new/,
			features: [ NewIssueEditor ]
		},
		{
			pattern: /\/issues\/\d+/,
			features: [ NewCommentEditor, CommentEditor ]
		},
		{
			pattern: /\/milestones\//,
			features: [ MilestoneEditor ]
		}
	],
	'repo_pulls': [
		{
			pattern: /\/pull\/\d+$/,
			features: [ NewCommentEditor, CommentEditor, NewInlineCommentEditor ]
		},
		{
			pattern: /\/pull\/\d+\/files$/,
			features: [ ReviewEditor, CommentEditor, NewInlineCommentEditor, CodeLineCommentEditor ]
		}
	],
	'repo_releases': [
		{
			pattern: /\/releases\/(?:new|edit)/,
			features: [ ReleaseEditor ]
		}
	],
	'repo_source': [
		{
			pattern: /\/compare\//,
			features: [ NewPullRequestEditor ]
		}
	],
	'repo_wiki': [
		{
			pattern: /\/wiki\/(?:_new|.+\/_edit)/,
			features: [ WikiEditor ]
		}
	],
	'/settings/replies': [
		{
			pattern: /\/settings\/replies/,
			features: [ SavedReplyEditor ]
		}
	],
	'edit_saved_reply': [
		{
			pattern: /\/settings\/replies\/\d+\/edit/,
			features: [ SavedReplyEditor ]
		}
	]
};

const router = {
	run() {
		const page = App.page.name;
		const path = window.__getLocation().pathname;

		const promises = [];

		const pageRoutes = routes[ page ];

		if ( pageRoutes ) {
			for ( const route of pageRoutes ) {
				if ( route.pattern.test( path ) ) {
					for ( const feature of route.features ) {
						promises.push( feature.run() );
					}
				}
			}
		}

		return Promise.all( promises );
	}
};

export default router;

// Handle editors inside pjax containers.
{
	document.addEventListener( 'pjax:start', ( { target } ) => {
		Editor.destroyEditors( target );
	}, { passive: true } );

	document.addEventListener( 'pjax:end', () => {
		setTimeout( () => {
			/* istanbul ignore next */
			if ( process.env.NODE_ENV !== 'production' ) {
				console.log( `pjax ended -> running the router on "${ window.location.pathname }"` );
			}

			router.run();
		}, 0 );
	}, { passive: true } );
}
