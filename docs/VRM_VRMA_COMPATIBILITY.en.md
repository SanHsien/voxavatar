# VRM / VRMA compatibility matrix (skeleton)

This document maps **synthetic** compatibility cases to existing Node quality tests. A real exporter matrix (VRoid Studio, Blender VRM Add-on, Unity UniVRM, etc.) is **deferred** until publicly citable, clearly licensed samples are available.

## Scope and boundaries

- **Covered**: synthetic GLB cases in `electron/vrm-quality.test.cjs` and `electron/vrma-quality.test.cjs`.
- **Not covered**: specific exporter versions, texture formats, expression presets, or live Three.js load / lip-sync outcomes.
- **Media policy**: no committed `.vrm` / `.vrma` binaries; cases are generated at test time by [`electron/fixtures/vrm-vrma/builders.cjs`](../electron/fixtures/vrm-vrma/builders.cjs). Machine-readable index: [`electron/fixtures/vrm-vrma/manifest.json`](../electron/fixtures/vrm-vrma/manifest.json).

## Verdict semantics

The analyzer emits `keep`, `review`, or `reject`, plus a 0–100 score and issue codes. Directory import behavior depends on the settings-page `report` / `strict` / `off` gate; this matrix documents **analyzer expectations** only, not UI behavior.

## VRM synthetic cases

| Case id | Description | Builder | Expected verdict | Expected score / issues | Matching test |
| --- | --- | --- | --- | --- | --- |
| `vrm-complete` | Complete VRM 1.0 humanoid + mesh + expression | `buildVrmGlb()` | keep or review | score ≥ 70; not reject | `complete VRM scores as keep or mild review` |
| `vrm0-array-bones` | VRM 0.x `humanBones` array layout | `buildVrmGlb({ vrm0ArrayHumanoid: true })` | keep | score ≥ 75; no `low_bone_coverage` | `VRM0 array humanBones is parsed for coverage (not false low_bone_coverage)` |
| `vrm-missing-extension` | No VRM / VRMC_vrm extension | `buildVrmGlb({ includeExtension: false })` | reject | `missing_vrm_extension` | `missing VRM extension is rejected` |
| `vrm-missing-humanoid` | Extension present, humanoid missing | `buildVrmGlb({ includeHumanoid: false })` | review or reject | `missing_humanoid` | `missing humanoid is review or reject` |
| `vrm-broken` | Non-GLB bytes | raw `not-a-glb` | reject | `parse_error` | `broken file is rejected` |

## VRMA synthetic cases

| Case id | Description | Builder | Expected verdict | Expected score / issues | Matching test |
| --- | --- | --- | --- | --- | --- |
| `vrma-smooth-loop` | Multi-bone smooth rotation, loop-friendly | `buildRotationVrma()` | keep or review | score ≥ 70; not reject | `smooth looping VRMA scores as keep or mild review` |
| `vrma-velocity-spike` | Mid-clip angular velocity spike | `buildRotationVrma({ spike: true, angle: 0.15 })` | review or reject | issue code prefix `velocity` | `velocity spike VRMA is marked review or reject` |
| `vrma-broken` | Non-GLB bytes | raw `not-a-glb` | reject | `parse_error` | `broken file is rejected` |

## Deferred (real exporter matrix)

The following are intentionally out of scope for this skeleton:

1. Representative `.vrm` / `.vrma` samples per exporter/version (source and license cited only; no binaries in-repo).
2. Live Three.js load, rig alignment, expression, and VRMA playback result columns.
3. Cross-reference with import smoke steps in [`docs/WINDOWS_VALIDATION.md`](WINDOWS_VALIDATION.md).

## Related docs

- Traditional Chinese: [`VRM_VRMA_COMPATIBILITY.md`](VRM_VRMA_COMPATIBILITY.md)
- Fixture README: [`electron/fixtures/vrm-vrma/README.md`](../electron/fixtures/vrm-vrma/README.md)
- Implementations: [`electron/vrm-quality.cjs`](../electron/vrm-quality.cjs), [`electron/vrma-quality.cjs`](../electron/vrma-quality.cjs)
