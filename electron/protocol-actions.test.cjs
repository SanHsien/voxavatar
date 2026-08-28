"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { parseProtocolUrl } = require("./protocol-actions.cjs");

test("maps VoxAvatar URLs to lifecycle and clamped level events", () => {
  const commands = parseProtocolUrl("voxavatar://speaking?level=3");
  assert.equal(commands[0].event.state.activity, "speaking");
  assert.deepEqual(commands[1].event, { type: "audio-level", level: 1 });
  assert.equal(parseProtocolUrl("voxavatar://inactive")[0].event.state.phase, "inactive");
});

test("maps window and configured animation URLs without accepting another scheme", () => {
  assert.deepEqual(parseProtocolUrl("voxavatar://toggle"), [{ type: "toggle" }]);
  assert.deepEqual(parseProtocolUrl("voxavatar://animation?name=wave-hello"), [
    { type: "animation-command", animationName: "wave-hello" },
  ]);
  assert.equal(parseProtocolUrl("voxavatar://animation?name=Wave%20Hello"), null);
  assert.equal(parseProtocolUrl("voxavatar://animation"), null);
  assert.equal(parseProtocolUrl("another-product://show"), null);
  assert.equal(parseProtocolUrl("not a URL"), null);
});
