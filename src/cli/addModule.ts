import chalk from "chalk";
import ora from "ora";
import path from "path";
import fs from "fs-extra";

import { getPaths } from "../util/getPaths.js";
import { type MergeableObject, mergeObject } from "../util/mergeObject.js";
import { type PromptAnswers } from "./promptOptions.js";

export const addModule = async (
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
      const mainPkg = (await fs.readJson(
        path.join(targetDir, "package.json")
      )) as MergeableObject;
      const extraPkg = (await fs.readJson(
        path.join(moduleDir, "package.json")
      )) as MergeableObject;

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
