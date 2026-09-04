# Runtime Data Relocation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate Academe PostgreSQL, Redis, content, and backup data into an ignored `runtime-data/` directory inside the project while preserving a complete rollback copy.

**Architecture:** Stop all writers before copying filesystem data, preserve numeric ownership and permissions, switch only the Academe-owned Compose bind mounts, then verify persistence and public health. Keep `/home/dev/RxProjects/Academe-data` unchanged until the user separately approves deletion.

**Tech Stack:** Docker Compose, PostgreSQL 16/pgvector, Redis 7 AOF, filesystem bind mounts.

**Spec:** `ACADEME_CUSTOMIZATIONS.md`

## Global Constraints

- Never copy a live PostgreSQL data directory while PostgreSQL is writing.
- Create a logical PostgreSQL backup before stopping services.
- Preserve file ownership, permissions, links, and timestamps.
- Add `runtime-data/` to `.gitignore` before creating data beneath it.
- Do not modify upstream application source code.
- Do not delete `/home/dev/RxProjects/Academe-data` during this task.
- Create no Git commit until the complete Academe work batch is ready for one unified commit.

---

### Task 1: Prepare and back up the current deployment

**Files:**
- Modify: `.gitignore`
- Create locally, ignored: `runtime-data/{postgres,redis,content,backups}`
- Modify: `ACADEME_INSTALLATION_STATUS.md`

**Interfaces:**
- Consumes: healthy `academe-app`, `academe-postgres`, and `academe-redis` containers
- Produces: ignored destination directories and a pre-migration logical database backup

- [ ] **Step 1: Add the ignore boundary**

Add `/runtime-data/` to the root `.gitignore` and verify `git check-ignore runtime-data` succeeds.

- [ ] **Step 2: Record pre-migration health**

Verify all three containers are healthy, the local API returns HTTP 200, and the public root returns HTTP 200.

- [ ] **Step 3: Create destination directories**

Create `runtime-data/postgres`, `runtime-data/redis`, `runtime-data/content`, and `runtime-data/backups` without removing the old directories.

- [ ] **Step 4: Create a logical PostgreSQL backup**

Run `pg_dump` from the current PostgreSQL container into `runtime-data/backups`, verify a non-empty dump, and record its checksum without printing credentials.

---

### Task 2: Stop writers and copy runtime data

**Files:**
- Copy from: `/home/dev/RxProjects/Academe-data/{postgres,redis,content,backups}`
- Copy to: `runtime-data/{postgres,redis,content,backups}`

**Interfaces:**
- Consumes: stopped and consistent source data
- Produces: a permission-preserving destination copy

- [ ] **Step 1: Stop the Compose project**

Stop all three services and verify no container is writing to the old bind mounts.

- [ ] **Step 2: Copy data with numeric ownership preserved**

Use a root process inside a local Docker image to copy each source directory into its matching destination with archive semantics.

- [ ] **Step 3: Compare source and destination**

Compare per-directory file counts and byte counts from inside a privileged read-only inspection container. Do not start services if any comparison differs.

---

### Task 3: Switch Compose and validate the new location

**Files:**
- Modify: `deploy/docker-compose.yml`
- Modify: `ACADEME_CUSTOMIZATIONS.md`
- Modify: `ACADEME_INSTALLATION_STATUS.md`

**Interfaces:**
- Consumes: verified `runtime-data/` copy
- Produces: a healthy deployment using project-local ignored data

- [ ] **Step 1: Change only the bind-mount sources**

Point PostgreSQL, Redis, and content mounts to `../runtime-data/postgres`, `../runtime-data/redis`, and `../runtime-data/content` relative to `deploy/docker-compose.yml`.

- [ ] **Step 2: Validate Compose resolution**

Run `docker compose config --quiet` and inspect resolved mount sources. Expected sources are under `/home/dev/RxProjects/Academe/runtime-data/`.

- [ ] **Step 3: Start infrastructure and application**

Start PostgreSQL and Redis, wait for healthy status, then start the application and wait for its health check.

- [ ] **Step 4: Verify application and persistence**

Verify local root, API health, public root, initial organization/user records, Redis AOF presence, and content directory accessibility.

- [ ] **Step 5: Verify rollback remains available**

Confirm `/home/dev/RxProjects/Academe-data` remains unchanged and document the old Compose mount values required for rollback.

- [ ] **Step 6: Update documentation and Git boundaries**

Record the successful migration, mark `runtime-data/` as ignored local state, update the customization inventory, and run a secret scan over all files intended for the final unified commit.
