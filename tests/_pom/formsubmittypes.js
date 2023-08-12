/*
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md.
 */

const formSubmitTypes = {
	/**
	 * Default editor submit form type
	 */
	PRIMARY: 'PRIMARY',

	/**
	 * New pull request editor submit form type
	 */
	NEW_PR: 'NEW_PR',

	/**
	 * New comment in a pull request editor submit form type
	 */
	PR_NEW_COMMENT: 'PR_NEW_COMMENT',

	/**
	 * Edit a pull request comment editor submit form type
	 */
	PR_EDIT_COMMENT: 'PR_EDIT_COMMENT',

	/**
	 * New code line comment in a pull request editor submit form type
	 */
	PR_CODE_LINE_COMMENT: 'PR_CODE_LINE_COMMENT',

	/**
	 * New pull request review comment editor submit form type
	 */
	PR_REVIEW_COMMENT: 'PR_REVIEW_COMMENT'
};

module.exports = formSubmitTypes;
