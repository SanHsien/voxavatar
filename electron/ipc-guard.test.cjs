"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  assertTrustedIpcSender,
  isTrustedIpcSender,
  senderUrlFromEvent,
} = require("./ipc-guard.cjs");

test("allows trusted file and development renderer senders", () => {
  const fileAllowed = "file:///C:/app/dist/index.html";
  const settingsAllowed = "file:///C:/app/dist/index.html?view=settings";
  assert.equal(
    isTrustedIpcSender(
      { senderFrame: { url: fileAllowed } },
      [fileAllowed, settingsAllowed],
    ),
    true,
  );
  assert.equal(
    isTrustedIpcSender(
      { sender: { getURL: () => settingsAllowed } },
      [fileAllowed, settingsAllowed],
    ),
    true,
  );
  assert.equal(
    isTrustedIpcSender(
      { senderFrame: { url: "http://127.0.0.1:5173/" } },
      ["http://127.0.0.1:5173/", "http://127.0.0.1:5173/?view=settings"],
    ),
    true,
  );
});

test("rejects unknown sender URLs", () => {
  assert.equal(
    isTrustedIpcSender(
      { senderFrame: { url: "https://evil.example/" } },
      ["file:///C:/app/dist/index.html"],
    ),
    false,
  );
  assert.equal(isTrustedIpcSender({ senderFrame: { url: "" } }, []), false);
  assert.equal(senderUrlFromEvent({}), null);
  assert.throws(
    () =>
      assertTrustedIpcSender(
        { senderFrame: { url: "https://evil.example/" } },
        ["file:///C:/app/dist/index.html"],
      ),
    /Unauthorized IPC sender/,
  );
});
