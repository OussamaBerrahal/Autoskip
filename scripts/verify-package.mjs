import { readFileSync, existsSync } from "node:fs";
import { Script } from "node:vm";
import assert from "node:assert/strict";
const manifest = JSON.parse(readFileSync("dist/manifest.json", "utf8"));
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(manifest.version, pkg.version);
for (const file of [
  manifest.background.service_worker,
  manifest.action.default_popup,
  manifest.options_ui.page,
  ...Object.values(manifest.icons),
]) {
  assert(existsSync(`dist/${file}`), `Missing extension asset: ${file}`);
}
for (const entry of manifest.content_scripts) {
  for (const file of entry.js)
    new Script(readFileSync(`dist/${file}`, "utf8"), { filename: file });
}
for (const page of ["popup", "options"]) {
  const html = readFileSync(`dist/${page}.html`, "utf8");
  for (const [, asset] of html.matchAll(
    /(?:src|href)="(\.[^"]+\.(?:js|css))"/g,
  )) {
    assert(existsSync(`dist/${asset}`), `Missing ${page} asset: ${asset}`);
  }
}
console.log(
  "Extension package verified: content script syntax and entrypoint assets.",
);
