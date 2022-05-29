## GitHub Writer - Running tests

The GitHub Writer source code contains three sets of tests that fulfill different goals:

 * [Unit tests](#unit-tests): guarantees that the source code works as expected.
 * [Functional tests](#functional-tests): test GitHub Writer directly inside the GitHub.com website.
 * [Compatibility tests](#compatibility-tests): monitors the GitHub.com website for changes that could break GitHub Writer.

---

### Unit tests

GitHub Writer comes with an extensive suite of unit tests. It's our goal to keep 100% code coverage with quality and "real" tests.

We use [CKEditor 5 Tests](https://www.npmjs.com/package/@ckeditor/ckeditor5-dev-tests) as our test framework. It brings several goodies with it, like Karma, Mocha, Chai, Sinon, Istanbul, Webpack, among other tools.

#### Preparing the runner

Unfortunately, CKEditor 5 Tests cannot be used as-is for GitHub Writer. There is a [pull request pending acceptation](https://github.com/ckeditor/ckeditor5-dev/pull/594) that is necessary.

Fortunately, a git branch is available with the patched code. So, to run unit tests, the first step is cloning to patched runner locally:

```sh
# Clone the git repo.
git clone https://github.com/ckeditor/ckeditor5-dev.git

# Move to GitHub Writer branch.
cd ckeditor5-dev
git checkout github-writer

# Install dependencies.
yarn

# Mark CKEditor 5 Tests for linking.
cd packages/ckeditor5-dev-tests
yarn link
```

Now we can update our local copy of GitHub Writer, so it'll link to the above code:

```sh
cd [some-path]/github-writer
yarn link "@ckeditor/ckeditor5-dev-tests"
```

#### Running unit test

To run the tests using your local Chrome browser:

```sh
yarn test
```

To run with Firefox:

```sh
yarn test --browsers=Firefox
```

---

### Functional tests

The source code contains a suite of automated **functional tests** that can be run to verify a local GitHub Writer build.

#### First step, build the extension

The first step is building the browser extension to be tested from the source. Check the [Developer Documentation](../dev/README.md) for details.

#### Test runner configuration

The tests run in the browser and real-life GitHub.com pages are navigated and their features used, with the extension enabled, just like an end-user would do. All this is automated by our test runner.

There are two things that the runner needs to have to be able to use github.com properly:

*   A real GitHub user name and password. The runner will impersonate this account, logging into github.com with these credentials.
*   A real GitHub repository name. The runner will use the features available in this repository to perform tests (create issues, PRs, wiki pages, etc.)

**Attention:** It is evident that the above account and repository should be created on purpose and stay dedicated to testing. There is no warranty that data may not be lost in the account or the repository due to the test runner and, mainly, **credentials will be available as plain text in a local configuration file**.

##### The configuration file

The configuration file for the test runner, a JSON file, must be located at `tests/config.json`. This file must be created manually as it's not available in the code repository (it's ignored by git). A template is available at `tests/config.template.json`.

These are the expected contents of `tests/config.json`:

```json
{
  "github" : {
    "repo": "username/reponame",
    "credentials": {
      "name": "username",
      "password": "password"
    }
  }
}
```

#### Running functional tests

Having the build and the configuration in place, it's enough to execute the following at the root of your local clone of the project:

```plaintext
yarn run test-functional
```

Now lay back and enjoy watching the test runner doing its job.

##### About the browser/user profile

Note that tests are run under a dedicated browser profile, not using the operating system one. So it's safe to assume that your everyday use browser is not at risk, neither is your personal information.

Additionally, because of the above, the browser session used for testing has no extensions installed. The only extension loaded, as expected, is your local build of GitHub Writer, which is reloaded from scratch for every test run.

---

### Compatibility tests

GitHub may bring changes to their website which could potentially break GitHub Writer. For example, the DOM in their pages could be modified or XHR request may return data in a new, different format.

In such situations, there is nothing more we can do about that other than react fast, publishing a new release of GitHub Writer that fixes the incompatibility.

To help to monitor the GitHub Writer compatibility with GitHub.com, a series of tests have been designed. To execute them, simply run the following:

```sh
yarn run test-compat
```

The above fires a Chromium browser (without GitHub Writer) that navigates through GitHub pages, making the necessary checks.

---

### Additional developer information

*   [Development](../dev/README.md) (setup, build, run).
*   [Architecture](../src/README.md) (source code, API).
