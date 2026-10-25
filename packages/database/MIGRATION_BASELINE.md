# Prisma migration history and deployment safety

## Current verified development baseline

As of 2026-10-23, the repository contains 17 migration folders. The latest is:

`20261022110000_remove_legacy_student_user_id`

The last reported development verification found that all 17 migrations were
applied, `prisma migrate status` was up to date, the schema diff was empty, and
`prisma validate` succeeded. Treat this as the last verified development
baseline, not as a permanent migration count. Always check the actual target
database; the number of migration folders does not prove that a database is up
to date.

## Pending hostel fee billing migration

`20261024100000_hostel_fee_billing` adds billing frequency and an idempotency
key for automatic hostel invoices. Existing fees default to monthly; when
multiple active fees share a property and category, only the newest remains
active. This migration has not been applied or verified against a target
database in this session.

## Migration safety

- Read `prisma/schema.prisma` and inspect migration history before schema
  changes. Check Git status and preserve existing user changes.
- Never delete, rename, consolidate, or rewrite migrations already applied to
  a database. Add a new timestamped migration for each required schema change.
- Check existing data and application usage before removing data or columns;
  obtain explicit approval for destructive changes. Avoid duplicate schema
  objects.
- Review migration SQL before applying it and save it as UTF-8 without a BOM.
- After a development migration, verify migration status, an empty schema diff,
  `prisma validate`, and relevant tests and builds. If a check fails, stop and
  investigate the database state; do not automatically mark a migration
  applied or rolled back.
- Before production deployment, inspect production migration status, review
  pending SQL, confirm backups, and check for data-loss risks. Apply reviewed
  migrations with `prisma migrate deploy`. Never use `prisma migrate reset`,
  `prisma db push`, or `prisma migrate dev` against production. Deploy
  application code that depends on a migration only when that migration is
  available to the deployment pipeline.

## Historical baseline

The migration chain began with the baseline migration:

`20260801000000_baseline_schema`

Legacy SQL is archived at `prisma/migrations_legacy_archive/` and is not
applied by Prisma.

## Fresh environments

```bash
export DATABASE_URL=...
pnpm run db:deploy
pnpm run db:generate
pnpm run db:sync-check
```

`migrate deploy` must create the full schema with zero drift.

## Existing production / QA databases

Never apply the baseline migration blindly to a database that already has
application tables. Verify that environment's migration status and schema
before deployment, and stop to investigate any drift or failed migration.
Do not clear or rewrite `_prisma_migrations` as a routine deployment step.

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
