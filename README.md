# create-ts-init

`create-ts-init` is a simple and opinionated boilerplate generator for TypeScript projects. Spend less time configuring new projects with this CLI tool.

## Installation / Usage

You can use your favorite package manager to download and run the generator, and your choice will also be respected when the CLI installs dependencies.

### npm

```bash
npx create-ts-init@latest
```

### pnpm

```bash
pnpx create-ts-init@latest
```

### yarn

```bash
yarn create ts-init
```

### Global Install

You can also use any of these to install `create-ts-init` globally. This links a binary that can be used without redownloading.

You will still be notified of new versions, but you will have to update manually to get the latest features.

Example:

```bash
npm install -g create-ts-init

create-ts-init
```


## Features

### Minimal base

`create-ts-init` is designed to be fully modular. The base template is minimal and contains only what is necessary to compile and run TypeScript code. Additional functionality must be enabled through the prompts, including code style enforcement using ESLint and Prettier.

Additional features can be scaffolded to a new application through use of modules (or extras).

### Update checking

When creating a new application, you will be asked if you want to automatically check for package updates. The CLI will then use the [npm-check-updates](https://github.com/raineorshine/npm-check-updates) tool to apply the latest versions directly to your new `package.json` while respecting their original semver rules.

## Planned features

- Support for more modules
- Command arguments/flags

## Contributing

Contributions are welcome! If you find a bug or have an idea for a new feature, feel free to open an issue or submit a pull request.

To get started, clone this repository and install dependencies using npm:

```bash
git clone https://github.com/nomnivore/create-ts-init.git
cd create-ts-init
npm install
```

Compile the application into `./dist`:

```bash
npm run build
```

You can then run the tool locally using:

```bash
npm start
```

Or install it globally (to use in other directories):

```bash
npm install -g .

create-ts-init
```

## License

`create-ts-init` is licensed under the [MIT License](https://opensource.org/licenses/MIT).
