import chalk from "chalk";

export const abortCLI = () => {
  console.log(chalk.red("Aborting ..."));
  process.exit(1);
};
