# VRM / VRMA compatibility matrix (skeleton)

This document maps **synthetic** compatibility cases to existing Node quality tests. A real exporter matrix is **not established yet**; the **Exporter notes** section below summarizes assumptions and known limits from public documentation only — **not** verified against real files.

## Scope and boundaries

- **Covered**: synthetic GLB cases in `electron/vrm-quality.test.cjs` and `electron/vrma-quality.test.cjs`.
- **Not covered**: specific exporter versions, texture formats, expression presets, or live Three.js load / lip-sync outcomes.
- **Media policy**: no committed `.vrm` / `.vrma` binaries; cases are generated at test time by [`electron/fixtures/vrm-vrma/builders.cjs`](../electron/fixtures/vrm-vrma/builders.cjs). Machine-readable index: [`electron/fixtures/vrm-vrma/manifest.json`](../electron/fixtures/vrm-vrma/manifest.json).
- **Import safety**: incompatible files are rejected before catalog writes; regression tests live in `electron/settings-store.test.cjs` (`failed model import…`, `addAnimationClips rolls back…`).

## Verdict semantics

The analyzer emits `keep`, `review`, or `reject`, plus a 0–100 score and issue codes. Directory import behavior depends on the settings-page `report` / `strict` / `off` gate; this matrix documents **analyzer expectations** only, not UI behavior.

## VRM synthetic cases

| Case id | Description | Builder | Expected verdict | Expected score / issues | Matching test |
| --- | --- | --- | --- | --- | --- |
| `vrm-complete` | Complete VRM 1.0 humanoid + mesh + expression | `buildVrmGlb()` | keep or review | score ≥ 70; not reject | `complete VRM scores as keep or mild review` |
| `vrm0-array-bones` | VRM 0.x `humanBones` array layout | `buildVrmGlb({ vrm0ArrayHumanoid: true })` | keep | score ≥ 75; no `low_bone_coverage` | `VRM0 array humanBones is parsed for coverage (not false low_bone_coverage)` |
| `vrm-missing-extension` | No VRM / VRMC_vrm extension | `buildVrmGlb({ includeExtension: false })` | reject | `missing_vrm_extension` | `missing VRM extension is rejected` |
| `vrm-missing-humanoid` | Extension present, humanoid missing | `buildVrmGlb({ includeHumanoid: false })` | review or reject | `missing_humanoid` | `missing humanoid is review or reject` |
| `vrm-no-mesh` | Extension present, no meshes | `buildVrmGlb({ includeMesh: false })` | reject | `no_meshes` | `VRM without meshes is rejected` |
| `vrm-sparse-humanoid` | Sparse mapping (hips / spine / head only) | `buildVrmGlb({ sparseHumanoidBones: true })` | review | `low_bone_coverage` | `sparse humanoid bone coverage is marked review` |
| `vrm-no-textures` | Mesh/material present, no textures | `buildVrmGlb({ includeTextures: false })` | keep or review | `no_textures` | `VRM without textures is flagged` |
| `vrm-no-expressions` | No expressions / blendShapes | `buildVrmGlb({ includeExpressions: false })` | keep or review | `missing_expressions` | `VRM without expressions is flagged` |
| `vrm-broken` | Non-GLB bytes | raw `not-a-glb` | reject | `parse_error` | `broken file is rejected` |

## VRMA synthetic cases

| Case id | Description | Builder | Expected verdict | Expected score / issues | Matching test |
| --- | --- | --- | --- | --- | --- |
| `vrma-smooth-loop` | Multi-bone smooth rotation, loop-friendly | `buildRotationVrma()` | keep or review | score ≥ 70; not reject | `smooth looping VRMA scores as keep or mild review` |
| `vrma-velocity-spike` | Mid-clip angular velocity spike | `buildRotationVrma({ spike: true, angle: 0.15 })` | review or reject | issue code prefix `velocity` | `velocity spike VRMA is marked review or reject` |
| `vrma-too-short` | Duration under 0.4 s | `buildRotationVrma({ duration: 0.25, frames: 6 })` | review or reject | `too_short` | `too-short VRMA clip is marked review or reject` |
| `vrma-no-animation` | GLB without animation block | `buildRotationVrma({ includeAnimation: false })` | reject | `no_animation` | `VRMA without animation tracks is rejected` |
| `vrma-loop-seam` | First/last pose seam gap (not mid-clip spike) | `buildRotationVrma({ loopSeam: true, … })`; default `loop` | review or reject | issue code prefix `loop_seam`; not `velocity_spike` | `loop seam VRMA is marked review or reject` |
| `vrma-one-shot-seam` | Same seam, purpose `one-shot` | `analyzeVrmaFile(…, { purpose: "one-shot" })` | not reject (no seam penalty) | no `loop_seam*` | `one-shot purpose does not reject for loop seam alone` |
| `vrma-pose-static` | Near-static clip, purpose `pose` | `buildRotationVrma({ angle: 0 })` + `purpose: "pose"` | not penalized as `dead_motion` | no `dead_motion` | `pose purpose skips dead-motion…` |
| `vrma-broken` | Non-GLB bytes | raw `not-a-glb` | reject | `parse_error` | `broken file is rejected` |

Animation purpose (`loop` / `one-shot` / `pose`) comes from analyze options or settings schema 7 clip `purpose`; default is `loop`. Directory import infers purpose from the target animation type.

## Exporter notes

Common tools, assumptions, and publicly documented caveats. Status meanings:

- `synthetic-covered`: a synthetic case and automated test exist — **not** a real export from that tool.
- `pending-human-sample`: needs a publicly citable, clearly licensed real `.vrm` / `.vrma` before live matrix columns can be filled.

| Exporter | Typical output | Public-doc assumptions / known limits | Synthetic coverage | Status |
| --- | --- | --- | --- | --- |
| **VRoid Studio** | VRM 0.x / 1.0; official VRMA | Default exports include humanoid, mesh, and expression presets; VRM 0.x uses a `humanBones` **array**; VRMA from VRoid Hub motion library | `vrm-complete`, `vrm0-array-bones`, `vrm-no-expressions`, `vrma-smooth-loop` | `synthetic-covered` (VRM skeleton / missing expressions); `pending-human-sample` (real VRoid files) |
| **UniVRM** (Unity) | VRM 0.x / 1.0; VRMA (UniVRM 1.x) | Requires a valid Unity Humanoid Avatar for full humanoid mapping; Unity left-handed space converted on export; expressions bound via blend shapes | `vrm-complete`, `vrm-sparse-humanoid`, `vrm-no-textures`, `vrma-smooth-loop` | `synthetic-covered` (sparse skeleton / missing textures); `pending-human-sample` (Unity pipeline files) |
| **Blender VRM Add-on** | VRM 0.x / 1.0 | Depends on armature + VRM Humanoid panel alignment; optional mesh / blend-shape export; bone names must match VRM humanoid spec or coverage drops | `vrm-sparse-humanoid`, `vrm-no-mesh`, `vrm-no-textures`, `vrm-missing-humanoid` | `synthetic-covered` (missing mesh / textures / sparse bones); `pending-human-sample` (Blender exports) |

> Public sources (version not verified here): [VRM Consortium specs](https://vrm.dev/en/vrm/vrm_meta/), [UniVRM README](https://github.com/vrm-c/UniVRM), [Blender VRM Add-on docs](https://vrm-addon-for-blender.info/en/latest/). Real-file behavior may differ by version.

## Deferred (real exporter matrix)

The following are intentionally out of scope for this skeleton:

1. Representative `.vrm` / `.vrma` samples per exporter/version (source and license cited only; no binaries in-repo).
2. Live Three.js load, rig alignment, expression, and VRMA playback result columns.
3. Cross-reference with import smoke steps in [`docs/WINDOWS_VALIDATION.md`](WINDOWS_VALIDATION.md).

## Related docs

- Traditional Chinese: [`VRM_VRMA_COMPATIBILITY.md`](VRM_VRMA_COMPATIBILITY.md)
- Fixture README: [`electron/fixtures/vrm-vrma/README.md`](../electron/fixtures/vrm-vrma/README.md)
- Implementations: [`electron/vrm-quality.cjs`](../electron/vrm-quality.cjs), [`electron/vrma-quality.cjs`](../electron/vrma-quality.cjs)
