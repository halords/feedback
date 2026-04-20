---
phase: 9
plan: 1
wave: 1
gap_closure: true
---

# Plan 9.1: Housekeeping & Engine Alignment

## Objective
Finalize the environment and clean up documentation to ensure a clean handoff to the next milestone.

## Tasks

<task type="auto">
  <name>Align Node.js Engines</name>
  <files>package.json</files>
  <action>
    Update the `engines` field in `package.json` to allow Node 20 to 25.
    Formula: `>=20`.
  </action>
  <verify>Run npm install (simulated or manual)</verify>
  <done>EBADENGINE warnings are resolved</done>
</task>

<task type="auto">
  <name>Clean Stale TODOs</name>
  <files>.gsd/TODO.md</files>
  <action>Remove lines 3-7 and 11-12 from TODO.md as they are no longer relevant.</action>
  <verify>Read file to confirm</verify>
  <done>TODO.md only contains relevant future debt</done>
</task>
