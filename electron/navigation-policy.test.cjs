"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { isAllowedRendererNavigation } = require("./navigation-policy.cjs");

test("allows only the renderer entry or its development origin", () => {
  assert.equal(
    isAllowedRendererNavigation(
      "file:///opt/VoxAvatar/resources/app.asar/dist/index.html#view",
      "file:///opt/VoxAvatar/resources/app.asar/dist/index.html",
    ),
    true,
  );
  assert.equal(
    isAllowedRendererNavigation(
      "file:///opt/VoxAvatar/resources/app.asar/dist/other.html",
      "file:///opt/VoxAvatar/resources/app.asar/dist/index.html",
    ),
    false,
  );
  assert.equal(
    isAllowedRendererNavigation(
      "http://127.0.0.1:5173/scene",
      "http://127.0.0.1:5173/",
    ),
    true,
  );
  assert.equal(
    isAllowedRendererNavigation(
      "https://example.com/",
      "http://127.0.0.1:5173/",
    ),
    false,
  );
});
