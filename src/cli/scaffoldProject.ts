import ora from "ora";
import path from "path";
import fs from "fs-extra";

import { getPaths } from "../util/getPaths.js";
import { abortCLI } from "./abort.js";
import { type PromptAnswers } from "./promptOptions.js";
import { addModule } from "./addModule.js";

export const scaffoldProject = async (projectOptions: PromptAnswers) => {
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

  // copy and merge any additional extras

  if (projectOptions.extras.length > 0) {
    console.log();
    for (const extra of projectOptions.extras) {
      await addModule(extra, projectOptions);
    }
  }

  // finish configuring package.json
  console.log();
  const finishSpinner = ora("Finishing up").start();
  const pkgJson = (await fs.readJson(path.join(targetDir, "package.json"))) as {
    name: string;
  }; // quick and dirty cast until we get proper typings
  Object.assign(pkgJson, {
    name: projectOptions.projectName,
  });

  // save package.json
  await fs.writeJson(path.join(targetDir, "package.json"), pkgJson, {
    spaces: 2,
  });

  finishSpinner.succeed("Project scaffolded!");
};
