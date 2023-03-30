export type PkgMan = "npm" | "yarn" | "pnpm";

/** returns the package manager used to run the cli, or npm as default */
export const getPkgMan = (): PkgMan => {
  const agent = process.env.npm_config_user_agent;

  if (agent?.startsWith("pnpm")) return "pnpm";
  if (agent?.startsWith("yarn")) return "yarn";

  return "npm";
};

export const getPkgRunner = (pkgMan?: PkgMan) => {
  pkgMan ||= getPkgMan();
  let file: string;
  const argsPrefix: string[] = []; // yarn uses "yarn dlx" which can't be directly passed into execa
  const ncuSuffix: string[] = [];

  switch (pkgMan) {
    case "pnpm":
      file = "pnpx";
      ncuSuffix.push("-p", "pnpm");
      break;

    // TODO: yarn v1 doesn't support dlx
    // need to check yarn version
    case "yarn":
      file = "npx";
      // argsPrefix.push("dlx");
      ncuSuffix.push("-p", "yarn");
      break;

    default:
      file = "npx";
  }

  return {
    file,
    argsPrefix,
    fullCmd: `${file} ${argsPrefix.join(" ")}`.trim(),
    ncuSuffix, // for npm-check-updates
  };
};

export const getPkgRunnerAsString = (pkg: string, pkgMan?: PkgMan) => {
  pkgMan ||= getPkgMan();
  const { file, argsPrefix, ncuSuffix } = getPkgRunner(pkgMan);

  return `${file} ${argsPrefix.join(" ")} ${pkg} ${ncuSuffix.join(" ")}`;
};

export const getPkgInstall = (pkgMan?: PkgMan) => {
  pkgMan ||= getPkgMan();
  // 'install' is the same for all 3
  // but this sets up for future changes if needed
  return {
    file: pkgMan as string,
    args: ["install"],
    fullCmd: `${pkgMan} install`,
  };
};
