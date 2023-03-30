import https from "https";
import fs from "fs-extra";
import path from "path";

import { root } from "./dirname.js";

function hasVersion(json: unknown): json is { version: string } {
  return typeof json === "object" && json !== null && "version" in json;
}

export const checkCliVersion = async () => {
  const pkgJson = (await fs.readJson(path.join(root, "package.json"))) as {
    version: string;
  };
  const currentVer = hasVersion(pkgJson) ? pkgJson.version : "0.3.0"; // first version with self-updating
  const latestVer = await getLatestVersion().catch(() => null);

  // if error, assume up to date
  return {
    upToDate: currentVer === latestVer || latestVer === null,
    currentVer,
    latestVer: latestVer || "",
  };
};

const getLatestVersion = () => {
  return new Promise<string>((resolve, reject) => {
    https.get("https://registry.npmjs.org/create-ts-init/latest", (res) => {
      if (res.statusCode !== 200) {
        reject();
      }
      let data = "";

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const json = JSON.parse(data) as unknown;
        if (hasVersion(json)) {
          resolve(json.version);
        } else {
          reject();
        }
      });

      res.on("error", () => {
        // this should be a network error
        reject();
        // reject(err.message);
      });
    });
  });
};
