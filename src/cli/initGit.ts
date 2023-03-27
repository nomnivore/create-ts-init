import chalk from "chalk";
import { execa } from "execa";
import ora from "ora";
import { getPaths } from "../util/getPaths.js";
import { type PromptAnswers } from "./promptOptions.js";

export const initGit = async (projectOptions: PromptAnswers) => {
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
