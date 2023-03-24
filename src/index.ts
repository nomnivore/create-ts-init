#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { execa } from "execa";

import { root } from "./util/dirname.js";
import { mergeObject } from "./util/mergeObject.js";

type PromptAnswers = {
  projectName: string;
  useStyle: string;
  checkUpdates: boolean;
  checkUpdatesFlags: string[];
  installDeps: boolean;
  initGit: boolean;
};

const run = async () => {
  console.log(chalk.cyan.bold("\nWelcome to create-ts-starter-app!"));
  console.log(
    chalk.italic("\nPlease note that only npm is supported for now.\n")
  );

  const programOptions = await promptProjectOptions();

  await checkExistingDir(programOptions);

  try {
    await scaffoldProject(programOptions);
  } catch (err) {
    console.log(
      chalk.red(
        "An unexpected error occured while scaffolding your new project."
      )
    );
    console.log(chalk.red(err));

    // ? should we delete the targetDir here to cleanup?
    abortCLI();
  }

  await checkUpdates(programOptions);
  await installDependencies(programOptions);
  await initGit(programOptions);

  const nextCommands = [`cd ${programOptions.projectName}`];
  if (!programOptions.installDeps) {
    nextCommands.push("npm install");
  }
  nextCommands.push("npm run dev");

  console.log(
    chalk.cyan(
      `\nYour project ${chalk.bold(
        programOptions.projectName
      )} has been successfully created!`
    )
  );
  console.log(
    chalk.cyan(
      "You can run the following commands to get started:\n\n",
      ...nextCommands.map((cmd) => `  ${cmd}\n`)
    ),
    "\n"
  );
};

const checkExistingDir = async (projectOptions: PromptAnswers) => {
  const { targetDir } = getPaths(projectOptions.projectName);
  // check if target directory exists and if it contains files
  if (fs.existsSync(targetDir)) {
    if ((await fs.readdir(targetDir)).length > 0) {
      console.log(
        chalk.cyan(
          `\nThe directory ${chalk.bold(
            targetDir
          )} already exists and is not empty.`
        )
      );
      const { overwrite } = await inquirer.prompt({
        name: "overwrite",
        message:
          "Do you want to overwrite all files and folders in this directory?",
        type: "confirm",
        default: false,
      });

      if (!overwrite) {
        abortCLI();
      }

      const deleteSpinner = ora(`Deleting contents of ${targetDir}`).start();

      try {
        fs.removeSync(targetDir);
        deleteSpinner.succeed(`Deleted contents of ${targetDir}`);
      } catch (err) {
        deleteSpinner.fail(`Could not delete contents of ${targetDir}`);
        console.log(chalk.red(err));

        abortCLI();
      }
    }
  }
};

const installDependencies = async (projectOptions: PromptAnswers) => {
  if (!projectOptions.installDeps) return;

  const { targetDir } = getPaths(projectOptions.projectName);
  try {
    console.log(`Running ${chalk.italic("npm install")} for you.`);
    const installProcess = execa("npm", ["install"], {
      cwd: targetDir,
      stdio: "inherit",
    });

    await installProcess;
  } catch (err) {
    console.log(chalk.red(err));

    console.log(
      chalk.red(
        "An unexpected error occured while installing dependencies. " +
          `You may need to run your package manager's ${chalk.italic(
            "install"
          )} command yourself.`
      )
    );
  }
};

const checkUpdates = async (projectOptions: PromptAnswers) => {
  if (!projectOptions.checkUpdates) return;

  const { targetDir } = getPaths(projectOptions.projectName);
  try {
    const updateProcess = execa(
      "npx",
      ["npm-check-updates", ...projectOptions.checkUpdatesFlags],
      {
        cwd: targetDir,
        stdio: "inherit",
      }
    );

    await updateProcess;
  } catch (err) {
    console.log(chalk.red(err));
  }
};

const initGit = async (projectOptions: PromptAnswers) => {
  if (!projectOptions.initGit) return;

  // TODO: check if git is installed

  const spinner = ora("Initializing git repository").start();
  const { targetDir } = getPaths(projectOptions.projectName);
  try {
    await execa("git", ["init"], { cwd: targetDir });
    await execa("git", ["add", "."], { cwd: targetDir });

    spinner.succeed("Git repository initialized and files staged");
  } catch (err) {
    spinner.fail("Could not initialize git repository");
    console.log(chalk.red(err));
  }
};

const scaffoldProject = async (projectOptions: PromptAnswers) => {
  const { targetDir, templateDir } = getPaths(projectOptions.projectName);

  const baseSpinner = ora("Copying base template").start();

  // start by copying the base template to the targetDir
  try {
    await fs.copy(path.join(templateDir, "base"), targetDir);
    await fs.move(
      path.join(targetDir, "_gitignore"),
      path.join(targetDir, ".gitignore")
    );
  } catch (err) {
    baseSpinner.fail("Could not copy base template");
    abortCLI();
  }

  baseSpinner.succeed("Base template copied");

  console.log();
  // copy and merge code style option
  if (projectOptions.useStyle != "none") {
    await addExtra(projectOptions.useStyle, projectOptions);
  }

  // TODO: copy and merge any additional extras here

  // finish configuring package.json
  console.log();
  const finishSpinner = ora("Finishing up").start();
  const pkgJson = await fs.readJson(path.join(targetDir, "package.json"));
  Object.assign(pkgJson, {
    name: projectOptions.projectName,
  });
  if (pkgJson.hasOwnProperty("$schema")) delete pkgJson["$schema"];

  // save package.json
  await fs.writeJson(path.join(targetDir, "package.json"), pkgJson, {
    spaces: 2,
  });

  finishSpinner.succeed("Project scaffolded!");
};

const addExtra = async (
  name: string,
  projectOptions: PromptAnswers,
  extrasDir?: string
) => {
  const { targetDir, templateDir } = getPaths(projectOptions.projectName);
  extrasDir ||= path.join(templateDir, "extra");
  const moduleDir = path.join(extrasDir, name);

  if (!fs.existsSync(moduleDir)) {
    console.log(chalk.red(`Extra ${name} does not exist`));
    return;
  }

  const spinner = ora(`Adding ${name}`).start();

  try {
    await fs.copy(moduleDir, targetDir, {
      overwrite: true,
      filter: (name) => !name.endsWith("package.json"),
    });
  } catch (_e) {
    spinner.fail(`Could not add ${name}`);
    return;
  }

  try {
    if (fs.existsSync(path.join(moduleDir, "package.json"))) {
      const mainPkg = await fs.readJson(path.join(targetDir, "package.json"));
      const extraPkg = await fs.readJson(path.join(moduleDir, "package.json"));

      mergeObject(mainPkg, extraPkg);

      await fs.writeJson(path.join(targetDir, "package.json"), mainPkg, {
        spaces: 2,
      });
      spinner.succeed(`Added ${name}`);
    }
  } catch (_e) {
    spinner.fail(`Could not add ${name}`);
    return;
  }
};

const promptProjectOptions = async (): Promise<PromptAnswers> => {
  const { projectName } = await inquirer.prompt<PromptAnswers>({
    name: "projectName",
    message: "What will your project be named?",
    type: "input",
    default: "my-ts-starter-app",
  });

  const { useStyle } = await inquirer.prompt<PromptAnswers>({
    name: "useStyle",
    message: "How do you want to enforce code style?",
    type: "list",
    choices: [
      { name: "ESLint + Prettier", value: "eslint-prettier" },
      new inquirer.Separator(),
      { name: "None", value: "none" },
    ],
    default: "eslint-prettier",
  });

  const { initGit } = await inquirer.prompt<PromptAnswers>({
    name: "initGit",
    message: "Do you want to initialize a new git repository?",
    type: "confirm",
    default: true,
  });

  const { checkUpdates, checkUpdatesFlags } =
    await inquirer.prompt<PromptAnswers>([
      {
        name: "checkUpdates",
        message: `Do you want to check for dependency updates with ${chalk.italic(
          "npm-check-updates"
        )}?`,
        type: "confirm",
        default: true,
      },
      {
        name: "checkUpdatesFlags",
        message: "Select the options you'd like for upgrading dependencies",
        type: "checkbox",
        loop: false,
        choices: [
          {
            name: "Upgrade versions in package.json",
            value: "-u",
            checked: true,
            short: "Upgrade",
          },
          {
            name: "Let me select updates (interactive)",
            value: "-i",
            short: "Interactive",
          },
          new inquirer.Separator("---Choose One---"),
          {
            name: "Latest (default)",
            value: ["-t", "latest"],
            checked: true,
            short: "Latest",
          },
          {
            name: "Minor only",
            value: ["-t", "minor"],
            short: "Minor",
          },
          {
            name: "Patch only",
            value: ["-t", "patch"],
            short: "Patch",
          },
        ],

        // use a validate prop here to check for incompatible flags
        validate: (input: PromptAnswers["checkUpdatesFlags"]) => {
          // make sure only one -t flag is set
          const count = input.filter((x) => x === "-t").length;
          if (count > 1) {
            return "You can only select one target version";
          }

          return true;
        },

        filter: (input: (string | string[])[]) => input.flat(),
        when: (answers) => answers.checkUpdates,
      },
    ]);

  const { installDeps } = await inquirer.prompt<PromptAnswers>({
    name: "installDeps",
    message: `Do you want to install dependencies with ${chalk.italic(
      "npm install"
    )}?`,
    type: "confirm",
    default: true,
  });

  const programOptions: PromptAnswers = {
    projectName,
    useStyle,
    checkUpdates,
    checkUpdatesFlags,
    installDeps,
    initGit,
  };

  return programOptions;
};

const abortCLI = () => {
  console.log(chalk.red("Aborting ..."));
  process.exit(1);
};

const getPaths = (projectName = "") => {
  return {
    cwd: process.cwd(),
    targetDir: path.join(process.cwd(), projectName),
    templateDir: path.join(root, "template"),
  };
};

run().catch((err) => console.log(chalk.red(err)));
