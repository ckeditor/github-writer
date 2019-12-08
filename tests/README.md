## GitHub RTE - Running Tests

The source code contains a suite of automated **functional tests** that can be run to verify a local GitHub RTE build.

### First step, build the extension

The fist step is building the browser extension to be tested from source. Check the [Developer Documentation](../dev/README.md) for details.

### Test runner configuration

The tests run in the browser and real life github.com pages are navigated and their features used, with the extension enabled, just like an end user would do. All this is automated by our test runner.

That are two things that the runner needs to have to be able to use github.com properly:

*   A real GitHub user name and password. The runner will impersonate this account, logging into github.com with these credentials.
*   A real GitHub repository name. The runner will use the features available in this repository to perform tests (create issues, PRs, wiki pages, etc.)

**Attention:** It is evident that the above account and repository should be created on purpose and stay dedicated to testing. There is no warranty that data may not be lost in the account or the repository due to the test runner and, mainly, **credentials will be available as plain text in a local configuration file**.

#### The configuration file

The configuration file for the test runner, a JSON file, must be located at `tests/config.json`. This file must be created manually as it's not available in the code repository (and ignored by git). A template is available at `tests/config.template.json`.

These are the expected contents of `tests/config.json`:

```plaintext
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

### Running tests

Having the build and the configuration in place, it's enough to execute the following at the root of your local clone of the project:

```plaintext
yarn run test
```

Now lay back and enjoy watching the test runner doing its job.

#### About the browser/user profile

Note that tests are run under a dedicated browser profile, not using the operating system one. So it's safe to assume that your everyday use browser is not at risk, neither your personal information.

Additionally, because of the above, the browser session used for testing has no extensions installed. The only extension loaded, as expected, is your local build of GitHub RTE, which is reloaded from scratch for every test run.

### Additional developer information

*   [Development](../dev/README.md) (setup, build, run).
*   [Architecture](../src/README.md) (source code, API).
