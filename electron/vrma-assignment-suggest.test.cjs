"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  assignableVrmaSuggestions,
  suggestVrmaAssignment,
  suggestVrmaAssignments,
} = require("./vrma-assignment-suggest.cjs");

const animations = [
  { id: "a-idle", animation_name: "idle", animation_type: "IDLE" },
  { id: "a-speak", animation_name: "speaking", animation_type: "TALK" },
  { id: "a-work", animation_name: "working", animation_type: null },
  { id: "a-wave", animation_name: "wave", animation_type: null },
];

test("suggestVrmaAssignment matches exact and prefix names", () => {
  assert.equal(
    suggestVrmaAssignment("wave.vrma", animations).animationId,
    "a-wave",
  );
  assert.equal(
    suggestVrmaAssignment("wave-hi.vrma", animations).matchKind,
    "name_prefix",
  );
});

test("suggestVrmaAssignment whitelist maps idle/talk stems", () => {
  const idle = suggestVrmaAssignment("rest_loop.vrma", animations);
  assert.equal(idle.matchKind, "whitelist_slot");
  assert.equal(idle.animationId, "a-idle");
  const talk = suggestVrmaAssignment("speak_a.vrma", animations);
  assert.equal(talk.animationId, "a-speak");
});

test("suggestVrmaAssignment leaves unknown files unassigned", () => {
  const result = suggestVrmaAssignment("dance.vrma", animations);
  assert.equal(result.matchKind, "none");
  assert.equal(result.animationId, null);
});

test("assignableVrmaSuggestions drops none matches", () => {
  const suggestions = suggestVrmaAssignments(
    ["idle.vrma", "unknown.vrma"],
    animations,
  );
  assert.equal(assignableVrmaSuggestions(suggestions).length, 1);
});
