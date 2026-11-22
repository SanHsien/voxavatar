"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  MAX_ASSET_BYTES,
  validateGlbFile,
} = require("./settings-asset-validation.cjs");

test("settings-asset-validation exports GLB helpers", () => {
  assert.equal(typeof validateGlbFile, "function");
  assert.equal(MAX_ASSET_BYTES, 200 * 1024 * 1024);
});

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  GLB_JSON_CHUNK_TYPE,
  copyValidatedGlbFile,
} = require("./settings-asset-validation.cjs");

function glbBuffer(document) {
  const json = Buffer.from(JSON.stringify(document));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const contents = Buffer.alloc(20 + jsonLength, 0x20);
  contents.write("glTF", 0, "ascii");
  contents.writeUInt32LE(2, 4);
  contents.writeUInt32LE(contents.length, 8);
  contents.writeUInt32LE(jsonLength, 12);
  contents.writeUInt32LE(GLB_JSON_CHUNK_TYPE, 16);
  json.copy(contents, 20);
  return contents;
}

function documentWith(extension) {
  return {
    asset: { version: "2.0" },
    ...(extension
      ? {
          extensionsUsed: [extension],
          extensions: { [extension]: { specVersion: "1.0" } },
        }
      : {}),
  };
}

function importFixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "voxavatar-import-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const library = path.join(root, "library");
  fs.mkdirSync(library);
  return {
    root,
    library,
    destination: path.join(library, "stored.vrm"),
    write(name, contents) {
      const filePath = path.join(root, name);
      fs.writeFileSync(filePath, contents);
      return filePath;
    },
  };
}

test("import rejects a valid VRM whose source file is not named .vrm", (context) => {
  const fixture = importFixture(context);
  const vrm = glbBuffer(documentWith("VRMC_vrm"));
  const cases = [
    ["renamed.glb", /Expected a \.vrm file, got \.glb\./],
    ["renamed.vrma", /Expected a \.vrm file, got \.vrma\./],
    ["no-extension", /Expected a \.vrm file, got no extension\./],
    ["model.vrm.glb", /Expected a \.vrm file, got \.glb\./],
    ["huge.averyveryverylongextensionname", /Expected a \.vrm file, got an unrecognized extension\./],
  ];
  for (const [name, message] of cases) {
    const source = fixture.write(name, vrm);
    assert.throws(
      () => copyValidatedGlbFile(source, fixture.destination, ".vrm"),
      message,
      name,
    );
    assert.deepEqual(fs.readdirSync(fixture.library), [], name);
  }
});

test("import rejects a valid VRMA whose source file is not named .vrma", (context) => {
  const fixture = importFixture(context);
  const source = fixture.write(
    "clip.glb",
    glbBuffer(documentWith("VRMC_vrm_animation")),
  );
  assert.throws(
    () =>
      copyValidatedGlbFile(
        source,
        path.join(fixture.library, "stored.vrma"),
        ".vrma",
      ),
    /Expected a \.vrma file, got \.glb\./,
  );
  assert.deepEqual(fs.readdirSync(fixture.library), []);
});

test("import still copies a valid asset with the expected extension in any case", (context) => {
  const fixture = importFixture(context);
  const vrm = glbBuffer(documentWith("VRMC_vrm"));
  for (const name of ["model.vrm", "MODEL.VRM"]) {
    const source = fixture.write(name, vrm);
    copyValidatedGlbFile(source, fixture.destination, ".vrm");
    assert.deepEqual(fs.readdirSync(fixture.library), ["stored.vrm"]);
    assert.deepEqual(fs.readFileSync(fixture.destination), vrm);
    fs.rmSync(fixture.destination);
    fs.rmSync(source);
  }
});

test("import keeps rejecting bad content and leaves no file behind", (context) => {
  const fixture = importFixture(context);
  const cases = [
    ["corrupt.vrm", Buffer.from("this is not a glTF binary at all"), /valid VRM\/VRMA glTF 2 binary/],
    ["plain-glb.vrm", glbBuffer(documentWith(null)), /required \.vrm extension/],
    ["animation.vrm", glbBuffer(documentWith("VRMC_vrm_animation")), /required \.vrm extension/],
  ];
  for (const [name, contents, expected] of cases) {
    const source = fixture.write(name, contents);
    assert.throws(
      () => copyValidatedGlbFile(source, fixture.destination, ".vrm"),
      expected,
      name,
    );
    assert.deepEqual(fs.readdirSync(fixture.library), [], name);
  }
});

test("import rejects an oversized asset before copying it", (context) => {
  const fixture = importFixture(context);
  const source = fixture.write("huge.vrm", glbBuffer(documentWith("VRMC_vrm")));
  fs.truncateSync(source, 210 * 1024 * 1024);
  const copied = [];
  const originalCopy = fs.copyFileSync;
  fs.copyFileSync = (...args) => {
    copied.push(args[0]);
    return originalCopy(...args);
  };
  context.after(() => {
    fs.copyFileSync = originalCopy;
  });
  assert.throws(
    () => copyValidatedGlbFile(source, fixture.destination, ".vrm"),
    /200 MB or smaller/,
  );
  assert.deepEqual(copied, []);
  assert.deepEqual(fs.readdirSync(fixture.library), []);
});
