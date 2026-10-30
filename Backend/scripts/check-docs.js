import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { Script } from "node:vm";
import SwaggerParser from "@apidevtools/swagger-parser";

const spec = await SwaggerParser.validate(
  fileURLToPath(new URL("../docs/openapi.json", import.meta.url)),
);
const readJson = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const collection = await readJson(
  "../../Postman/FInal Project.postman_collection.json",
);
assert.equal(
  collection.info.schema,
  "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
);

let requests = 0;
const requestRoutes = [];
function checkScripts(item) {
  for (const event of item.event ?? []) {
    new Script(event.script.exec.join("\n"), {
      filename: `${item.name ?? collection.info.name}: ${event.listen}`,
    });
  }
  for (const child of item.item ?? []) checkScripts(child);
  if (!item.request) return;
  requests++;
  const rawUrl =
    typeof item.request.url === "string"
      ? item.request.url
      : item.request.url?.raw;
  assert.ok(rawUrl, `Missing request URL: ${item.name}`);
  const rawPath = rawUrl.replace(/^\{\{base_url\}\}/, "").split("?")[0];
  const path = rawPath.startsWith("/api/")
    ? rawPath
    : `/api${rawPath.startsWith("/") ? rawPath : `/${rawPath}`}`;
  requestRoutes.push({ method: item.request.method.toLowerCase(), path });
}
checkScripts(collection);
const matchesPath = (template, path) => {
  const templateSegments = template.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);
  return (
    templateSegments.length === pathSegments.length &&
    templateSegments.every(
      (segment, index) =>
        (segment.startsWith("{") && segment.endsWith("}")) ||
        segment === pathSegments[index],
    )
  );
};
for (const [path, operations] of Object.entries(spec.paths)) {
  if (path === "/health") continue;
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    if (operations[method]) {
      assert.ok(
        requestRoutes.some(
          (route) => route.method === method && matchesPath(path, route.path),
        ),
        `Missing collection operation: ${method} ${path}`,
      );
    }
  }
}
console.log(
  `OpenAPI valid; ${requests} Postman requests; scripts parse; all documented API operations are covered.`,
);
