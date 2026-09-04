# Tinybird Config Relocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Academe-owned Tinybird CLI configuration out of the upstream application tree without duplicating or modifying the upstream `events.datasource` definition.

**Architecture:** Keep the authoritative datasource at `apps/api/src/db/tinybird/datasources/events.datasource`. Store Academe-owned CLI configuration and ignored authentication state in `deploy/tinybird/`, with `include` pointing to the upstream datasource file.

**Tech Stack:** Tinybird CLI 4.6.16, Tinybird Forward datafiles, Git.

**Spec:** `ACADEME_CUSTOMIZATIONS.md`

## Global Constraints

- Do not modify tracked upstream source files.
- Do not duplicate `events.datasource`.
- Never commit or print `.tinyb` credentials.
- Do not deploy endpoint reference pipes as part of this migration.
- Create no Git commit until the complete Academe work batch is ready for one unified commit.

---

### Task 1: Create the external Tinybird project boundary

**Files:**
- Create: `deploy/tinybird/tinybird.config.json`
- Move locally: `apps/api/src/db/tinybird/.tinyb` to `deploy/tinybird/.tinyb`
- Remove: `apps/api/src/db/tinybird/tinybird.config.json`
- Modify: `.gitignore`
- Modify: `ACADEME_CUSTOMIZATIONS.md`
- Modify: `ACADEME_INSTALLATION_STATUS.md`

**Interfaces:**
- Consumes: `apps/api/src/db/tinybird/datasources/events.datasource`
- Produces: a Tinybird CLI project rooted at `deploy/tinybird/`

- [ ] **Step 1: Record the active migration in the progress document**

Document the target paths, the no-secret rule, the last successful step, and the rollback path.

- [ ] **Step 2: Create the external project configuration**

Create `deploy/tinybird/tinybird.config.json` with branch development mode and an `include` entry that resolves only `events.datasource` from the upstream tree.

- [ ] **Step 3: Validate the include boundary without deploying**

Run Tinybird CLI inspection/build help and a local configuration parse from `deploy/tinybird/`. Confirm the resolved resource set contains `events` and excludes `endpoints/*.pipe`.

- [ ] **Step 4: Relocate local authentication state**

Move `.tinyb` into `deploy/tinybird/` without printing it, verify mode and ownership, and confirm `.gitignore` excludes it.

- [ ] **Step 5: Remove the Academe-owned config from the upstream path**

Delete only the untracked `apps/api/src/db/tinybird/tinybird.config.json`; leave all upstream datasource and endpoint files unchanged.

- [ ] **Step 6: Verify Tinybird context**

Run `tb --cloud workspace current` from `deploy/tinybird/`. Expected: workspace `Academe`, region host `https://api.europe-west2.gcp.tinybird.co`, and no Token value in output.

- [ ] **Step 7: Update documentation**

Update the customization inventory and installation status with final paths and verification evidence.

---

### Task 2: Validate in a Cloud Branch

**Files:**
- Read: `deploy/tinybird/tinybird.config.json`
- Read: `apps/api/src/db/tinybird/datasources/events.datasource`

**Interfaces:**
- Consumes: the external Tinybird project boundary from Task 1
- Produces: a validated `events` datasource in an isolated Tinybird Cloud Branch

- [ ] **Step 1: Create or select an isolated Cloud Branch**

Use a dedicated branch named for the Academe analytics deployment; do not target the main workspace for the first build.

- [ ] **Step 2: Build the project in the Cloud Branch**

Run the Tinybird branch build from `deploy/tinybird/` and verify that only `events` is created or updated.

- [ ] **Step 3: Inspect the build result**

Confirm schema, MergeTree engine, monthly partition key, sorting key, and 365-day TTL match the upstream datasource definition.

- [ ] **Step 4: Record the checkpoint**

Update `ACADEME_INSTALLATION_STATUS.md` before any production deployment.
