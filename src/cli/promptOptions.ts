import inquirer from "inquirer";
import chalk from "chalk";
import { getPkgInstall } from "../util/pkgMan.js";

export type PromptAnswers = {
  projectName: string;
  extras: string[];
  checkUpdates: boolean;
  checkUpdatesFlags: string[];
  installDeps: boolean;
  initGit: boolean;
};

export const promptProjectOptions = async (): Promise<PromptAnswers> => {
  const { projectName } = await inquirer.prompt<PromptAnswers>({
    name: "projectName",
    message: "What will your project be named?",
    type: "input",
    default: "my-ts-app",
  });

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

  const { initGit } = await inquirer.prompt<PromptAnswers>({
    name: "initGit",
    message: "Do you want to initialize a new git repository?",
    type: "confirm",
    default: true,
  });

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

  const { fullCmd } = getPkgInstall();
  const { installDeps } = await inquirer.prompt<PromptAnswers>({
    name: "installDeps",
    message: `Do you want to install dependencies with ${chalk.italic(
      fullCmd
    )}?`,
    type: "confirm",
    default: true,
  });

  const programOptions: PromptAnswers = {
    projectName,
    extras,
    checkUpdates,
    checkUpdatesFlags,
    installDeps,
    initGit,
  };

  return programOptions;
};