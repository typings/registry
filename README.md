# Typings Registry

> The registry of type definitions for TypeScript.

## Contributing

1. Write a typings definition and upload to GitHub - here's an [example using debug](https://github.com/typings/typed-debug/blob/master/typings.json)
2. Make a pull request, using [semver](http://semver.org/) to specify which version the typing is valid for - here's [debug again](https://github.com/typings/registry/blob/master/npm/debug.json)
3. Once the pull request is merged, it is used as the canonical reference - `typings install debug`

## Structure

```
/<package manager>/<package name>.json
```

Where "package manager" is one of:

* **npm** for [NPM](https://www.npmjs.com/) dependencies
* **github** for [Duo](http://duojs.org/), [JSPM](http://jspm.io/), etc. using GitHub as a registry
* **bower** for [Bower](http://bower.io/) dependencies
* **ambient** for ambient dependencies (typings that describe our programming environment)
* **common** for dependencies not on any specific registry, but have a standardized library in JS

And "package name" is the name of the package in the registry. For GitHub and scoped NPM packages, it's valid to make a folder such as `@example/entry.json`. The format of each package file is described in `schema.json`.

## Requests

An up-to-date list of [typings requests](https://github.com/typings/meta/labels/typings%20request) are labelled in the [meta](https://github.com/typings/meta) repo.

## Questions?

For typings issues, questions or general help, you can always open an issue in the [meta](https://github.com/typings/meta) repo. To add an entry to the registry, please open a pull request with the update.
