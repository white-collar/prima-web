// Copies the static site into an output folder: used by GitHub Pages and by
// the desktop app (Tauri), so both ship exactly the same files.
//
// Usage: node tools/build-site.mjs [outDir=dist] [version]
// With a version, "?v=dev" in index.html becomes "?v=<version>" (cache busting).
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, process.argv[2] || "dist");
const version = process.argv[3];

const ENTRIES = ["index.html", "manifest.webmanifest", "css", "js", "icons"];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const entry of ENTRIES) {
  const src = join(root, entry);
  if (!existsSync(src)) throw new Error(`missing ${entry}`);
  cpSync(src, join(out, entry), { recursive: true });
}
writeFileSync(join(out, ".nojekyll"), "");

if (version) {
  const index = join(out, "index.html");
  const html = readFileSync(index, "utf8");
  const tagged = html.replaceAll("?v=dev", `?v=${version}`);
  if (tagged === html) throw new Error("no ?v=dev markers found in index.html");
  writeFileSync(index, tagged);
}
console.log(`site copied to ${out}${version ? ` (version ${version})` : ""}`);
