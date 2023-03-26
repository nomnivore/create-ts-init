# create-ts-init

create-ts-init (name pending) is a simple and opinionated boilerplate generator for TypeScript projects. Spend less time configuring and more time developing with this CLI tool.

## Installation

You can install create-ts-init globally using `npm`:

```bash
npm install -g create-ts-init
```

Alternatively, you can use `npx` to run the tool without installing it:

```bash
npx create-ts-init
```

## Usage

Create a new project by running:

```bash
# global install
create-ts-init

# npx
npx create-ts-init
```

This will start the CLI and run through a few prompts to create your new project.

## Features

### Minimal base

CTSA is designed to be fully modular. The base template is minimal and contains only what is necessary to compile and run TypeScript code. Additional functionality must be enabled through the prompts, including code style enforcement using ESLint and Prettier.

Additional features can be scaffolded to a new application through use of modules (or extras).

### Update checking

When creating a new application, you will be asked if you want to automatically check for package updates. The CLI will then use the [npm-check-updates](https://github.com/raineorshine/npm-check-updates) tool to apply the latest versions directly to your new `package.json` while respecting their original semver rules.

## Planned features

- Self-update checking
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

create-ts-init is licensed under the [MIT License](https://opensource.org/licenses/MIT).
