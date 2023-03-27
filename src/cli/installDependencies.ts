import chalk from "chalk";
import { execa } from "execa";
import { getPaths } from "../util/getPaths.js";
import { type PromptAnswers } from "./promptOptions.js";

export const installDependencies = async (projectOptions: PromptAnswers) => {
  if (!projectOptions.installDeps) return;

  const { targetDir } = getPaths(projectOptions.projectName);
  try {
    console.log(chalk.cyan(`Running ${chalk.italic("npm install")} for you.`));
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
