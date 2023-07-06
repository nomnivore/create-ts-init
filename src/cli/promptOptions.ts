import inquirer from "inquirer";
import chalk from "chalk";
import { Command } from "@commander-js/extra-typings";
import { getPkgInstall } from "../util/pkgMan.js";

export type PromptAnswers = {
  projectName: string;
  extras: string[];
  checkUpdates: boolean;
  checkUpdatesFlags: string[];
  installDeps: boolean;
  initGit: boolean;
};

// parse cli options from commander first
// examples:

// approve all defaults
//  create-ts-init my-app -egui

// skip extras prompt
//  create-ts-init my-app -ig --no-extras
const program = new Command()
  .argument("[project-name]", "name of the new project")
  .option("-e --extras", "use default extras")
  .option("--no-extras", "do not use extras")
  .option("-u --update", "check for and apply dependency updates")
  .option("--no-update", "do not check for dependency updates")
  .option("-i --install", "install dependencies")
  .option("--no-install", "do not install dependencies")
  .option("-g --git", "initialize a git repository")
  .option("--no-git", "do not initialize a git repository");

// TODO: refactor
export const promptProjectOptions = async (): Promise<PromptAnswers> => {
  const cliOpts = program.parse().opts();
  const cliArgs = program.args;

  const programOptions: Partial<PromptAnswers> = {};

  if (cliArgs[0]) {
    programOptions.projectName = cliArgs[0];
  } else {
    const { projectName } = await inquirer.prompt<PromptAnswers>({
      name: "projectName",
      message: "What will your project be named?",
      type: "input",
      default: "my-ts-app",
    });
    programOptions.projectName = projectName;
  }

  if (cliOpts.extras === undefined) {
    const { extras } = await inquirer.prompt<PromptAnswers>({
      name: "extras",
      message: "Which extras would you like to include?",
      type: "checkbox",
      // TODO: which of these should be default?
      choices: [
        { name: "ESLint + Prettier", value: "eslint-prettier", checked: true },
        { name: "Jest", value: "jest" },
      ],
      default: "eslint-prettier",
    });
    programOptions.extras = extras;
  } else {
    programOptions.extras = cliOpts.extras ? ["eslint-prettier"] : [];
  }

  if (cliOpts.git === undefined) {
    const { initGit } = await inquirer.prompt<PromptAnswers>({
      name: "initGit",
      message: "Do you want to initialize a new git repository?",
      type: "confirm",
      default: true,
    });
    programOptions.initGit = initGit;
  } else {
    programOptions.initGit = cliOpts.git;
  }

  if (cliOpts.update === undefined) {
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
              value: ["-t", "latest"],
              checked: true,
              short: "Latest",
            },
            {
              name: "Minor only",
              value: ["-t", "minor"],
              short: "Minor",
            },
            {
              name: "Patch only",
              value: ["-t", "patch"],
              short: "Patch",
            },
          ],

          // use a validate prop here to check for incompatible flags
          validate: (input: PromptAnswers["checkUpdatesFlags"]) => {
            // make sure only one -t flag is set
            const count = input.filter((x) => x === "-t").length;
            if (count > 1) {
              return "You can only select one target version";
            }

            return true;
          },

          filter: (input: (string | string[])[]) => input.flat(),
          when: (answers) => answers.checkUpdates,
        },
      ]);
    programOptions.checkUpdates = checkUpdates;
    programOptions.checkUpdatesFlags = checkUpdatesFlags;
  } else {
    programOptions.checkUpdates = cliOpts.update;

    // this can be set even if update is false, since we'll just skip the operation anyway
    programOptions.checkUpdatesFlags = ["-u", "-t", "latest"];
  }

  const { fullCmd } = getPkgInstall();
  if (cliOpts.install === undefined) {
    const { installDeps } = await inquirer.prompt<PromptAnswers>({
      name: "installDeps",
      message: `Do you want to install dependencies with ${chalk.italic(
        fullCmd
      )}?`,
      type: "confirm",
      default: true,
    });
    programOptions.installDeps = installDeps;
  } else {
    programOptions.installDeps = cliOpts.install;
  }

  return programOptions as PromptAnswers;
};
