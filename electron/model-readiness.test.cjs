"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { snapshotHasConfiguredModel } = require("./model-readiness.cjs");

test("requires an explicitly selected model before the avatar can start", () => {
  assert.equal(
    snapshotHasConfiguredModel({
      default_model_id: null,
      models: [],
    }),
    false,
  );
  assert.equal(
    snapshotHasConfiguredModel({
      default_model_id: "missing-model",
      models: [{ id: "available-model" }],
    }),
    false,
  );
  assert.equal(
    snapshotHasConfiguredModel({
      default_model_id: "available-model",
      models: [{ id: "available-model" }],
    }),
    true,
  );
});
