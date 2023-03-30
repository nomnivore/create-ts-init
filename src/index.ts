#!/usr/bin/env node

import chalk from "chalk";

import { abortCLI } from "./cli/abort.js";
import { checkExistingDir } from "./cli/checkExistingDir.js";
import { installDependencies } from "./cli/installDependencies.js";
import { promptProjectOptions } from "./cli/promptOptions.js";
import { checkUpdates } from "./cli/checkUpdates.js";
import { initGit } from "./cli/initGit.js";
import { scaffoldProject } from "./cli/scaffoldProject.js";
import { checkSelfUpdate } from "./cli/checkSelfUpdate.js";

const run = async () => {
  console.log(chalk.cyan.bold("\nWelcome to create-ts-init!"));
  await checkSelfUpdate();
  console.log(
    chalk.yellow(
      "This version is an early release and you may run into issues during use.",
      "\nFeel free to submit any feedback to the repo's issue tracker:",
      "\nhttps://github.com/nomnivore/create-ts-init/issues\n"
    )
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

run().catch((err) => console.log(chalk.red(err)));
