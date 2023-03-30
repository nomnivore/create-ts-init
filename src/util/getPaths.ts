import path from "path";
import { root } from "./dirname.js";

export const getPaths = (projectName = "") => {
  return {
    cwd: process.cwd(),
    targetDir: path.join(process.cwd(), projectName),
    templateDir: path.join(root, "template"),
  };
};
