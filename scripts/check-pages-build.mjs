import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../dist/public/index.html", import.meta.url), "utf8");

assert.match(html, /src="\/assets\/[^"]+\.js"/, "Pages JavaScript must load from the custom domain root");
assert.match(html, /href="\/assets\/[^"]+\.css"/, "Pages CSS must load from the custom domain root");
assert.doesNotMatch(html, /(?:src|href)="\/d8d-tech-website\//, "Project-path assets break the custom domain");
