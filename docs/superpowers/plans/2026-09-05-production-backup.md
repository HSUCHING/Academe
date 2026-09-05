# Academe Production Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and install a daily, verified local backup workflow for Academe PostgreSQL data and uploaded content without modifying upstream application source.

**Architecture:** Host-side shell scripts orchestrate the existing Docker Compose deployment. Database credentials stay inside the PostgreSQL container; content is archived through a read-only container mount. A systemd timer invokes the script daily, while all versioned artifacts remain under `deploy/backup/`.

**Tech Stack:** Bash, Docker Compose, PostgreSQL `pg_dump`/`pg_restore`, tar, SHA-256, systemd

**Spec:** `docs/superpowers/specs/2026-09-05-production-backup-design.md`

## Global Constraints

- Do not modify `apps/`, the root Dockerfile, or other upstream business source.
- Do not read, print, copy, archive, or commit `deploy/.env`.
- Store runtime artifacts only below ignored `runtime-data/backups/`.
- Publish a backup only after database, content, and checksum validation succeed.
- Retain successful local backups for 14 days; never delete history after a failed new backup.
- Keep off-server copies and real non-production restore drills unchecked until actually completed.
- Do not commit during individual tasks; the user requested one later Gitmoji commit.

---

### Task 1: Backup verifier

**Files:**
- Create: `deploy/backup/verify.sh`
- Create: `deploy/backup/tests/test_verify.sh`

**Interfaces:**
- Consumes: one completed or temporary backup directory path.
- Produces: exit code 0 only when required files, SHA-256 checks, PostgreSQL dump catalog, and content archive all validate.

- [x] **Step 1: Write the failing verifier contract test**

Create a shell test that constructs incomplete backup directories and asserts the absent `verify.sh` or incomplete artifacts cannot pass. It must also assert the verifier source invokes `sha256sum --check`, `pg_restore --list`, and `tar -tzf`.

- [x] **Step 2: Run the test and confirm RED**

Run: `bash deploy/backup/tests/test_verify.sh`

Expected: non-zero because `deploy/backup/verify.sh` does not exist.

- [x] **Step 3: Implement the verifier**

Implement strict Bash mode, canonical-directory validation, required-file checks for `postgres.dump`, `content.tar.gz`, `metadata.txt`, and `SHA256SUMS`, checksum verification from inside the backup directory, `pg_restore --list` through the existing `pgvector/pgvector:pg16` image, and host `tar -tzf` validation. Never source deployment environment files.

- [x] **Step 4: Run verifier tests**

Run: `bash -n deploy/backup/verify.sh deploy/backup/tests/test_verify.sh && bash deploy/backup/tests/test_verify.sh`

Expected: all contract cases pass.

### Task 2: Atomic backup workflow

**Files:**
- Create: `deploy/backup/backup.sh`
- Create: `deploy/backup/tests/test_backup_contract.sh`

**Interfaces:**
- Consumes: optional `ACADEME_BACKUP_RETENTION_DAYS` (default 14) and repository-relative Compose/content paths.
- Produces: `runtime-data/backups/academe-backup-<UTC timestamp>/` with four verified files.

- [x] **Step 1: Write the failing backup contract test**

Assert the script is absent or fails required static contracts: strict mode, `flock`, temporary directory beneath the backup root, container-internal `pg_dump`, read-only content mount, verifier invocation before final rename, and retention cleanup after publication only.

- [x] **Step 2: Run the test and confirm RED**

Run: `bash deploy/backup/tests/test_backup_contract.sh`

Expected: non-zero because `backup.sh` does not exist.

- [x] **Step 3: Implement the backup workflow**

Resolve the repository from the script path, validate backup/content roots, acquire a non-blocking lock, check PostgreSQL health, write into `.incomplete-<timestamp>-<pid>`, stream `pg_dump -Fc` without reading secrets on the host, archive content through a read-only mount, write non-secret metadata, generate checksums, call `verify.sh`, atomically rename to the final directory, then delete only matching backup directories older than the configured retention.

- [x] **Step 4: Run static tests**

Run: `bash -n deploy/backup/backup.sh deploy/backup/tests/test_backup_contract.sh && bash deploy/backup/tests/test_backup_contract.sh`

Expected: all contract cases pass.

### Task 3: Production backup and artifact verification

**Files:**
- Runtime create: `runtime-data/backups/academe-backup-<UTC timestamp>/` (ignored by Git)

**Interfaces:**
- Consumes: healthy current Compose deployment.
- Produces: first verified production backup and captured non-secret evidence.

- [x] **Step 1: Capture pre-run health and restart counts**

Run Docker inspection for `academe-postgres`, `academe-redis`, and `academe-app`; record status only, never environment.

- [x] **Step 2: Execute one online backup**

Run: `deploy/backup/backup.sh`

Expected: one newly published backup directory and exit code 0.

- [x] **Step 3: Independently verify the published backup**

Run `deploy/backup/verify.sh <new-directory>`, list filenames/sizes, scan filenames and metadata for forbidden configuration artifacts, and confirm no `.env` is present.

- [x] **Step 4: Confirm service health is unchanged**

Expected: all three containers remain healthy and restart counts do not increase.

### Task 4: Daily systemd scheduling

**Files:**
- Create: `deploy/backup/systemd/academe-backup.service`
- Create: `deploy/backup/systemd/academe-backup.timer`
- Create: `deploy/backup/install-systemd.sh`
- Create: `deploy/backup/tests/test_systemd_contract.sh`

**Interfaces:**
- Consumes: absolute current repository path `/home/dev/RxProjects/Academe`.
- Produces: enabled `academe-backup.timer`, daily at 03:15 local time with up to 15 minutes randomized delay.

- [x] **Step 1: Write failing unit contract tests**

Assert service is oneshot, runs the absolute backup script, has no environment secrets, timer uses `OnCalendar=*-*-* 03:15:00`, `RandomizedDelaySec=15m`, `Persistent=true`, and targets `timers.target`.

- [x] **Step 2: Run the test and confirm RED**

Run: `bash deploy/backup/tests/test_systemd_contract.sh`

Expected: non-zero because units do not exist.

- [x] **Step 3: Implement units and safe installer**

The installer copies only the two exact units to `/etc/systemd/system/`, sets mode 0644, reloads systemd, enables and starts the timer, and prints timer status without environment values. Interactive sudo was unavailable, so installation used the already authorized privileged Docker path without reading `.env`.

- [x] **Step 4: Validate and install scheduling**

Ran Shell syntax/contract tests and `systemd-analyze verify`, installed both units, then queried `systemctl is-enabled`, `systemctl is-active`, and the next timer execution.

Result: enabled, active, and scheduled for 2026-09-06 03:19:47 PDT.

### Task 5: Documentation and final verification

**Files:**
- Modify: `ACADEME_CUSTOMIZATIONS.md`
- Modify: `ACADEME_INSTALLATION_STATUS.md`
- Modify: `docs/superpowers/specs/2026-09-05-production-backup-design.md`
- Modify: this plan by changing completed `[ ]` entries to `[x]` without deleting them.

- [x] **Step 1: Record implementation evidence**

Recorded the new directory, schedule, retention, verification evidence, rollback instructions, upstream merge risk, and explicit remaining off-server/restore tasks. The design now states that local phase one is implemented.

- [x] **Step 2: Preserve historical task state**

Ticked only the PostgreSQL logical backup, content backup, deployment metadata, and local automation items proven by fresh evidence. Off-server replication and non-production restoration remain unchecked.

- [x] **Step 3: Run final safety checks**

Ran all three shell test files, syntax checks, `systemd-analyze verify`, `git diff --check`, secret-pattern scans, current backup verification, service health, timer status, disk usage, and patch artifact checks. Final combined command exited 0.

- [x] **Step 4: Report without committing**

Report passed, failed, and unexecuted checks. Keep all changes uncommitted until the user requests the unified Gitmoji commit and push.
