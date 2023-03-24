#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { execa } from "execa";

import { root } from "./util/dirname.js";

type PromptAnswers = {
  projectName: string;
  useStyle: string;
  checkUpdates: boolean;
  checkUpdatesFlags: string[];
  installDeps: boolean;
};

const run = async () => {
  console.log(chalk.blue.bold("\nWelcome to create-ts-starter-app!"));
  console.log(
    chalk.italic("\nPlease note that only npm is supported for now.\n")
  );

  const programOptions = await promptProjectOptions();

  await checkExistingDir(programOptions);

  console.log();
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

  await installDependencies(programOptions);
};

const checkExistingDir = async (projectOptions: PromptAnswers) => {
  const { targetDir } = getPaths(projectOptions.projectName);
  // check if target directory exists and if it contains files
  if (fs.existsSync(targetDir)) {
    if (fs.readdirSync(targetDir).length > 0) {
      console.log(
        chalk.red(
          `The directory ${chalk.bold(
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

      const deleteSpinner = ora(`Deleting ${targetDir}`).start();

      try {
        await fs.remove(targetDir);
        deleteSpinner.succeed();
      } catch (err) {
        deleteSpinner.fail(`Could not delete ${targetDir}`);
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

const scaffoldProject = async (projectOptions: PromptAnswers) => {
  const { targetDir, templateDir } = getPaths(projectOptions.projectName);

  const scaffoldSpinner = ora("Scaffolding your project").start();

  // start by copying the base template to the targetDir
  try {
    await fs.copy(path.join(templateDir, "base"), targetDir);
    await fs.move(
      path.join(targetDir, "_gitignore"),
      path.join(targetDir, ".gitignore")
    );
  } catch (err) {
    scaffoldSpinner.fail("Could not copy base template");
    console.log(chalk.red(err));
    abortCLI();
  }

  const pkgJson = await fs.readJson(path.join(targetDir, "package.json"));

  // TODO: remove eslint/prettier configs based on useStyle

  // TODO: copy and merge any extras here

  // finish configuring package.json
  Object.assign(pkgJson, {
    name: projectOptions.projectName,
  });

  // save package.json
  await fs.writeJson(path.join(targetDir, "package.json"), pkgJson, {
    spaces: 2,
  });

  scaffoldSpinner.succeed();
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
      { name: "Prettier", value: "prettier" },
      { name: "ESLint", value: "eslint" },
      new inquirer.Separator(),
      { name: "None", value: "none" },
    ],
    default: "eslint-prettier",
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
            value: "-t latest",
            checked: true,
            short: "Latest",
          },
          {
            name: "Minor only",
            value: "-t minor",
            short: "Minor",
          },
          {
            name: "Patch only",
            value: "-t patch",
            short: "Patch",
          },
          new inquirer.Separator(),
          {
            name: "Filter to peer compatible versions", // TODO: rephrase this to make more sense
            value: "--peer",
            short: "Peer",
          },
        ],

        // use a validate prop here to check for incompatible flags
        validate: (input: PromptAnswers["checkUpdatesFlags"]) => {
          const targets = ["-t latest", "-t minor", "-t patch"];
          const count = input.filter((x) => targets.includes(x)).length;

          if (count > 1) {
            return "You can only select one target version";
          }

          return true;
        },
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
