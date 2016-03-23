# Typings Registry

> The registry of type definitions for TypeScript.

## Contributing

1. Fork the project and run `npm install`
2. Write a typings definition and upload to GitHub - here's an [example using the npm's debug package](https://github.com/typed-typings/npm-debug/blob/master/typings.json)
3. Use [semver](http://semver.org/) to specify the _minimum_ version the typing is valid for - here's [debug again](https://github.com/typings/registry/blob/master/npm/debug.json)
4. Run `npm test` to check that the registry is valid, and make a pull request
5. Once the pull request is merged, it is used as the canonical reference - `typings install debug`

## Requests

An up-to-date list of [typings requests](https://github.com/typings/registry/labels/typings%20request) are labelled in the registry.

## Creating Your Own Typings

* Initialize a new repository (usually `typed-<package name>` to differentiate from your other projects)
* Use [generator-typings](https://github.com/typings/generator-typings) to generate the project, or manually:
  * Create a `typings.json` file, set `main` (and other valid options)
  * Make sure there's a license with your work
  * A README can help explain what people are looking at when they land on your repo

## Structure

The registry uses subdirectories to denote "sources". These sources are essentially mappings to package managers, and contain either ambient or external typings (depending on the "source").

```
/<source>/<name>.json
```

Where "source" is one of:

* **npm** for [NPM](https://www.npmjs.com/) dependencies (external)
* **github** for [Duo](http://duojs.org/), [JSPM](http://jspm.io/), etc. that use GitHub as the registry (external)
* **bower** for [Bower](http://bower.io/) dependencies (external)
* **common** for "standard" JS libraries without a "source" (external)
* **shared** for shared library functionality (external)
* **lib** for shared environment functionality (ambient)
* **env** for programming environment typings (ambient)
* **global** for global libraries (ambient)

And "name" is the name of the package from the source. For GitHub and scoped NPM packages, it's valid to make a folder such as `@example/entry.json`. The schema for package files is described using JSON schema in [`schema.json`](schema.json).

## Questions?

For typings issues, questions or general help, you can always open an issue in the [discussions](https://github.com/typings/discussions) repo. To add an entry to the registry, please open a pull request with the change.
