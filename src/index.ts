#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs-extra";
import chalk from "chalk";
import ora from "ora";
import path from "path";

import { root } from "./util/dirname.js";

type PromptAnswers = {
  projectName: string;
  useStyle: string;
  checkUpdates: boolean;
};

const run = async () => {
  console.log("Welcome to create-ts-starter-app!");
  console.log(
    chalk.italic("\nPlease note that only npm is supported for now.\n")
  );

  const programOptions = await promptProjectOptions();

  const { targetDir } = getPaths(programOptions.projectName);

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
        deleteSpinner.succeed("Done");
      } catch (err) {
        deleteSpinner.fail(`Could not delete ${targetDir}`);
        console.log(chalk.red(err));

        console.log();
      }
    }
  }

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
  Object.defineProperty(pkgJson, "name", projectOptions.projectName);
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

  const { checkUpdates } = await inquirer.prompt<PromptAnswers>({
    name: "checkUpdates",
    message: "Do you want to check for and use the latest NPM package updates?",
    type: "confirm",
    default: true,
  });

  const programOptions: PromptAnswers = {
    projectName,
    useStyle,
    checkUpdates,
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
