import chalk from "chalk";
import { checkCliVersion } from "../util/checkCliVersion.js";
import { getPkgRunner } from "../util/pkgMan.js";

export const checkSelfUpdate = async () => {
  const { upToDate, latestVer, currentVer } = await checkCliVersion();
  const { fullCmd } = getPkgRunner();
  console.log();
  if (upToDate) {
    console.log(chalk.yellow(`v${currentVer}`));
  } else {
    console.log(
      chalk.yellow(
        `v${currentVer} - Updates available: v${latestVer}`,
        `\nRun the following command for the latest updates:`
      ),
      chalk.yellow.bold(`\n\n ${fullCmd} create-ts-init@latest`)
    );
  }
  console.log();
};
