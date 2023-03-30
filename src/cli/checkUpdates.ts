import chalk from "chalk";
import { execa } from "execa";
import { getPaths } from "../util/getPaths.js";
import { type PromptAnswers } from "./promptOptions.js";
import { getPkgRunner } from "../util/pkgMan.js";

export const checkUpdates = async (projectOptions: PromptAnswers) => {
  if (!projectOptions.checkUpdates) return;

  const { file, argsPrefix, ncuSuffix } = getPkgRunner();
  console.log(
    chalk.cyan(
      `Checking for updates with ${chalk.italic("npm-check-updates")}...`
    )
  );
  const { targetDir } = getPaths(projectOptions.projectName);
  try {
    const updateProcess = execa(
      file,
      [
        ...argsPrefix,
        "npm-check-updates",
        ...projectOptions.checkUpdatesFlags,
        ...ncuSuffix,
      ],
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
