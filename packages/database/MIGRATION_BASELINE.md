# Prisma migration baseline cutover

## What changed

The historical migration chain under `prisma/migrations/` could not reproduce
`prisma/schema.prisma`. It has been replaced by a single baseline migration:

`20260801000000_baseline_schema`

Legacy SQL is archived at `prisma/migrations_legacy_archive/` (not applied by Prisma).

## Verified failure (before)

Empty database + old chain:

```text
P3018 on 20260318120000_lead_lifecycle_engine
ERROR: column "source" of relation "Lead" does not exist
```

## Fresh environments

```bash
export DATABASE_URL=...
pnpm run db:deploy
pnpm run db:generate
pnpm run db:sync-check
```

`migrate deploy` must create the full schema with zero drift.

## Existing production / QA databases

Do **not** run the baseline CREATE TABLE migration against a database that already
has application tables. That would fail with "relation already exists".

### Required operator procedure

1. Take a backup.
2. Confirm the live database already matches `schema.prisma`:

```bash
pnpm --filter @saas/database exec prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel packages/database/prisma/schema.prisma \
  --exit-code
```

Exit code `0` means no drift.  
Exit code `2` means drift — stop and reconcile the live schema to `schema.prisma`
with an explicit, reviewed SQL plan before continuing. Do not use `IF NOT EXISTS`
band-aids.

3. After the live schema matches, reset migration history bookkeeping only:

```bash
psql "$DATABASE_URL" -c 'DELETE FROM "_prisma_migrations";'
pnpm --filter @saas/database exec prisma migrate resolve \
  --applied 20260801000000_baseline_schema
pnpm --filter @saas/database exec prisma migrate status
```

4. Deploy application code that contains only the baseline migration.

## Prisma client generation (pnpm)

`prisma generate` must be run from the monorepo root:

```bash
pnpm run db:generate
# or
node scripts/prisma-generate.cjs
```

Do not use `pnpm --filter @saas/database exec prisma generate` — Prisma 5.22 fails to resolve
`@prisma/client` when cwd is `packages/database` under pnpm.

Generated client path:

`packages/database/generated/prisma`

Application code must import the ORM through `@saas/database` (not `@prisma/client`).

## Intentionally unchanged in Phase 1

- `schema.prisma` field nullability, defaults, and cascade rules are preserved.
- No destructive data migrations.
- Theme dual-storage and API/frontend contract fixes are out of scope for Phase 1.
