## **GitHub Writer - Architecture**

GitHub Writer is a browser extension. It is initially targeting Chrome, but it can potentially be ported to other browsers, Firefox being probably the next in the line.

### Browser extensions

Creating browser extensions revealed to be a pretty simple task. In fact, a single `manifest.json` file is enough for having an extension in place. More details can be found at the [Chrome Developer Guide for extensions](https://developer.chrome.com/extensions/devguide).

Among the many possible things one can do with extensions, it is possible to inject "content scripts" inside selected pages. In this way one can include JavaScript and CSS that are part of such pages. In our case, we inject these files:

*   `github-writer.js` (`src/github-writer.js`): The entry point for the application script, responsible for bootstrapping it execution. It's injected at the end of the page. It includes the whole application logic, including the CKEditor runtime code and theme.
*   `github-writer.css` (`src/github-writer.css`): The CSS that customizes GitHub pages and participate in the editor control logic.

#### Selective execution

The extension manifest file can be used to precisely specify in which pages the extension should be active (and the content scripts injected). We try to reduce it to the very minimum, to minimize the risk of the application running unnecessarily. [Check out the source code to see our restriction list](https://github.com/ckeditor/github-writer/blob/16899a4990f02c1a191b95ec2703b212681fa162/src/extension/manifest.json#L19-L26).

### The source code

The source code of GitHub Writer is available on GitHub. The following are details about its file structure:

*   **/src**: the source code, scripts and css.
    *   **github-writer.js**: the entry point of the extension script. It fires the application.
    *   **github-writer.css**: the whole CSS of the application. This doesn't include the CKEditor theme.
    *   **/app**: the application code.
        *   **app.js**: the application entry point.
        *   **/icons**: icons used in the application (mainly buttons).
        *   **/plugins**: CKEditor 5 plugins.
        *   **/theme**: customizations to the CKEditor 5 theme and editable contents.
        *   other files and directories are part of the application API.
    *   **/extension**: the extension manifest and its resources (icons).
*   **/dev**: development resources. The build script and Webpack configuration.
*   **/tests**: the tests and their configuration.

### The API

The entry point script of the extension (`github-writer.js`) simply calls `App.run()`, which bootstraps the application execution. The following may be a suitable visualization of the application API:

*   `App`: creates a `FileManager`.
    *   `FileManager`: searches for GitHub default markdown editors and creates instances of `Editor` to replace/control them.
        *   `Editor`: takes control over the markdown editor, wrapping it into a `MarkdownEditor`. Pairs it with a `RteEditor`, which uses CKEditor 5. `Editor` also controls the user view of either the rte or the markdown editor and their data synchronization.
            *   `MarkdownEditor`: controls the original markdown editor.
            *   `RteEditor`: the injected RTE.
*   `github-writer.css`: the styles defined in this file play an important
 role on the efficiency of the above API in performing its job. For example, when controlling the visibility of either the rte or the markdown editor.

That's basically it. The above API summarizes the whole logic of the application.

### Additional developer information

* [Development](../dev/README.md) (setup, build, run).
* [Tests](../tests/README.md) (architecture, configuration, run).
