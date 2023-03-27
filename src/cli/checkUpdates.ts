import chalk from "chalk";
import { execa } from "execa";
import { getPaths } from "../util/getPaths.js";
import { type PromptAnswers } from "./promptOptions.js";

export const checkUpdates = async (projectOptions: PromptAnswers) => {
  if (!projectOptions.checkUpdates) return;

  console.log(
    chalk.cyan(
      `Checking for updates with ${chalk.italic("npm-check-updates")}...`
    )
  );
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
