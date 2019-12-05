## GitHub RTE - Developer Documentation

### Getting the source code

The GitHub RTE is source code is available on GitHub: [https://github.com/fredck/github-rte-dev](https://github.com/fredck/github-rte-dev).

To get the source code:

1.  On terminal, move to the folder you want to have the source code in.
2.  Clone the repository:

```plaintext
git clone git@github.com:fredck/github-rte-dev.git
cd github-rte-dev
yarn
```

The above will not only clone the repository but also execute `yarn` so all code dependencies are downloaded.

### Building from source

The source code must be built so it can be used in the browser as an extension:

1.  Be sure that code dependencies have been downloaded (`yarn`). Run it as many times as you wish - no harm.
2.  Execute the build script:

```plaintext
yarn run build -d
```

The `-d` flag instructs the builder to produce a development friendly build. Without that flag, the build is optimized for production distribution.

You'll find the build files in the newly created `build/` directory. Note that this directory is silently deleted and recreated when executing the build script.

### Loading the built extension in the browser

Having successfully built from source, do the following to load the extension in the browser:

1.  In Chrome, click **Window** > **Extensions**. Or navigate to [chrome://extensions/](chrome://extensions/).
2.  Enable **Developer mode**, at the top right of the page.
3.  Click the **Load unpacked** button and select the `build/extension-chrome` directory from the build directory.

It's all set. Now visit [https://github.com/](https://github.com/) and start using the GitHub RTE editor inside issues, pull request and wiki pages.

### Changing the source code

To test changes to the source code, the following steps must always be done:

1.  Re-build by executing `yarn run build -d`.
2.  Refresh the extension in the browser:
    1.  In Chrome, click **Window** > **Extensions**. Or navigate to [chrome://extensions/](chrome://extensions/).
    2.  Click the reload button (⟳).

Now just reload GitHub pages and the updated extension will be executed.

### Useful resource

*   [CKEditor 5 documentation](https://ckeditor.com/docs/ckeditor5/latest/index.html)
*   [Chrome extension development guide](https://developer.chrome.com/extensions)
