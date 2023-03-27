import chalk from "chalk";
import fs from "fs-extra";
import inquirer from "inquirer";
import ora from "ora";

import { getPaths } from "../util/getPaths.js";
import { abortCLI } from "./abort.js";
import { type PromptAnswers } from "./promptOptions.js";

export const checkExistingDir = async (projectOptions: PromptAnswers) => {
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
      const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>({
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
