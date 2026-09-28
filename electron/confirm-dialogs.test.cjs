"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { LOCALES } = require("./i18n.cjs");
const {
  buildAssignByFilenameConfirmOptions,
  buildDirectoryImportConfirmOptions,
} = require("./confirm-dialogs.cjs");

test("buildDirectoryImportConfirmOptions fills quality detail", () => {
  const options = buildDirectoryImportConfirmOptions({
    t: LOCALES["zh-TW"],
    kind: "model",
    scanned: 5,
    importCount: 3,
    quality: { keep: 2, review: 1, reject: 2 },
    skippedQuality: 1,
  });
  assert.equal(options.type, "question");
  assert.equal(options.message, LOCALES["zh-TW"].importConfirmMessageModel);
  assert.match(options.detail, /掃描 5/);
  assert.match(options.detail, /匯入 3/);
  assert.match(options.detail, /保留 2/);
  assert.equal(options.defaultId, 0);
  assert.equal(options.cancelId, 1);
});

test("buildDirectoryImportConfirmOptions uses off-gate detail without quality", () => {
  const options = buildDirectoryImportConfirmOptions({
    t: LOCALES.en,
    kind: "animation",
    scanned: 2,
    importCount: 2,
    quality: null,
    skippedQuality: 0,
  });
  assert.equal(options.message, LOCALES.en.importConfirmMessageAnimation);
  assert.match(options.detail, /Scanned 2/);
  assert.match(options.detail, /import 2/);
});

test("buildAssignByFilenameConfirmOptions truncates long assignable lists", () => {
  const assignable = Array.from({ length: 15 }, (_, index) => ({
    basename: `clip-${index}.vrma`,
    animationName: `slot-${index}`,
  }));
  const options = buildAssignByFilenameConfirmOptions({
    t: LOCALES["zh-TW"],
    assignable,
    skipped: 2,
    total: 17,
  });
  assert.match(options.detail, /可對應 15/);
  assert.match(options.detail, /clip-0\.vrma → slot-0/);
  assert.match(options.detail, /… \+3/);
  assert.doesNotMatch(options.detail, /clip-14\.vrma/);
});
