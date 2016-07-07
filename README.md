# Typings Registry

> The registry of type definitions for TypeScript.

## Contributing

### As package author

You can create typings and distribute them with your NPM package. Check out how we can collaborate (if you need help) [in this issue](https://github.com/typings/typings/issues/322). The TypeScript team gives some additional help in [their handbook](https://www.typescriptlang.org/docs/handbook/typings-for-npm-packages.html), which entails creating a definition in external module format and linking to it from `package.json`. Feel free to ask questions!

### Ask the author

You can open an issue in the package's repository and ask if they'd be interested in providing a TypeScript definition for their users. If they are, you can link them to [this issue on collaborating](https://github.com/typings/typings/issues/322), in case they need a hand getting started.

### Contribute yourself

1. Fork the registry and run `npm install`
2. Write a typings definition and upload to GitHub - here's an [example using NPM's `debug` package](https://github.com/typings/typed-debug/blob/master/typings.json)
3. Use [semver](http://semver.org/) to specify the _minimum_ version the typings are valid for in the registry - here's [debug again](https://github.com/typings/registry/blob/master/npm/debug.json)
4. Commit and run `npm test` to check that the registry is valid, make a pull request
5. Once the pull request is merged, it will be used as the canonical reference - `typings install debug`

## Links

* Typings requests are labelled with [`typings request`](https://github.com/typings/registry/labels/typings%20request) in the issues
* If you'd like to help review PRs to the registry, see [#70](https://github.com/typings/registry/issues/70) to help out
* If you're wondering how to write tests for your typings, see [#150](https://github.com/typings/registry/issues/150)
* If you'd like to help collaborate on [`typed-typings`](https://github.com/typed-typings), see [#480](https://github.com/typings/registry/issues/480) so we can collaborate
* If you'd like to lint your definitions, try [`tslint-config-typings`](https://github.com/typings/tslint-config-typings)

## Creating Typings

* Initialize a new repository (usually `typed-<package name>` to differentiate from your other projects)
* Use [generator-typings](https://github.com/typings/generator-typings) to generate the project, or manually:
  * Create a `typings.json` file, set `main` (and other valid options)
  * Make sure there's a license with your work
  * A README can help explain what people are looking at when they land on your repo

## Structure

The registry uses subdirectories to denote "sources". These sources are essentially mappings to package managers, and contain either ambient or external module typings (depending on the "source").

```
/<source>/<name>.json
```

Where "source" is one of:

* **npm** for [NPM](https://www.npmjs.com/) dependencies (external)
* **github** for [Duo](http://duojs.org/), [JSPM](http://jspm.io/), etc. that use GitHub as the registry (external)
* **bower** for [Bower](http://bower.io/) dependencies (external)
* **common** for "standard" JS libraries without a "source" (external)
* **shared** for shared library functionality (external)
* **lib** for shared environment functionality (global)
* **env** for programming environment typings (global)
* **global** for global libraries (global)

And "name" is the name of the package from the source. For GitHub and scoped NPM packages, it's valid to make a folder such as `@example/entry.json`. The schema for package files is described using JSON schema in [`schema.json`](schema.json).

## Questions?

For typings issues, questions or general help, you can always open an issue in the [discussions](https://github.com/typings/discussions) repo. To add an entry to the registry, please open a pull request with the change.
