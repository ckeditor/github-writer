## GitHub WYSIWYG Rich-Text Editor

GitHub Writer is a WYSIWYG rich-text editor for GitHub. The extension is available when creating or commenting on issues, reviews, pull requests, and wikis. 

It provides all the features available in the GitHub plain-text editor, including Markdown input. For features like tables, it offers a much easier experience in comparison to plain-text Markdown and allows users to be more productive. 

It is powered by [CKEditor 5](https://ckeditor.com/ckeditor-5/), a modern JavaScript rich-text editor.

### Installation

The extension can be found at the following directories for an easy one click installation:

*   [GitHub Writer at Chrome Web Store](https://chrome.google.com/webstore/detail/github-writer/diilnnhpcdjhhkjcbdljaonhmhapadap)
*   [GitHub Writer at Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/github-writer/)

### Features

One of the goals of this extension is to provide all the typical features available in the GitHub plain-text editor, including Markdown support. The following is the list of GitHub features, with the ones checked already available in GitHub Writer:

*   Inline formatting
    *   Bold
    *   Italic
    *   Strikethrough
    *   Inline code
*   Structure
    *   Paragraphs (Enter)
    *   Soft line-break (Shift+Enter)
    *   Headings
    *   Horizontal line separator
*   Blocks
    *   Quotation
    *   Code block
        *   Language selection
*   Lists
    *   Bulleted list
    *   Numbered list
    *   Task/To-do list
*   Links
    *   On text
    *   Auto-link URLs on pasting.
    *   Auto-link URLs on typing.
*   Media
    *   Image upload (including Wiki)
        *   Drag-and-drop
        *   Paste
        *   Open file dialog
*   Mermaid diagrams
*   Auto-complete
    *   People (list when typing "@")
    *   Issues and PRs (list when typing "#")
*   Other
    *   Emoji
        *   OS, Unicode characters
        *   Auto-complete (list when typing ":")
    *   Escape Markdown in text
    *   Tables
    *   Quote selection (<kbd>r</kbd> key)
    *   PR code suggestions
    *   Saved replies

### Pages enabled

GitHub Writer should be enabled in all places where the original Markdown editor is available. The following are currently implemented:

*   Issues
    *   New
    *   Editing
    *   Comment
        *   Editing
*   Pull requests
    *   Create
    *   Comment
        *   Editing
    *   Review
    *   Code comments
        *   Editing
*   Commits
    *   Comment
    *   Line comment
*   Wiki pages
*   Releases
*   Milestones
*   Settings > Saved Replies

### Developer information

The source code contains additional readme files with technical details about the project:

*   [Development](dev/README.md) (setup, build, run).
*   [Tests](tests/README.md) (architecture, configuration, run).
*   [Architecture](src/README.md) (source code, API).

---

Copyright (c) 2003-2022, [CKSource](http://cksource.com) Holding sp. z o.o. All rights reserved.

GitHub is a trademark of [GitHub](https://github.com/), Inc.

