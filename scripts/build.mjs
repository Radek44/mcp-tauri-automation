import { rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Remove only this package's generated output so deleted modules cannot ship.
const root = new URL("../", import.meta.url);
await rm(new URL("dist/", root), { recursive: true, force: true });
const result = spawnSync(
  process.execPath,
  [fileURLToPath(new URL("node_modules/typescript/bin/tsc", root))],
  {
    cwd: fileURLToPath(root),
    stdio: "inherit",
  },
);
process.exit(result.status ?? 1);
