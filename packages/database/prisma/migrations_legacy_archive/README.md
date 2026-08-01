# Legacy migration archive (DO NOT APPLY)

These migrations are preserved for audit/history only.

They are **not** part of the active Prisma migration chain.

## Why they were removed

Verified against local PostgreSQL on 2026-08-01:

```text
Applying migration 20260318120000_lead_lifecycle_engine
ERROR: column "source" of relation "Lead" does not exist
(Prisma P3018)
```

Root cause chain:

1. `20260303040411_` dropped `Lead.phone` and `Lead.source`.
2. `20260318120000_lead_lifecycle_engine` altered/indexed those columns without recreating them.
3. Multiple current schema objects were never created by any migration (`Tenant.slug`, `FollowUp`, current `Feedback` columns, `Lead.location`, etc.).

A clean `prisma migrate deploy` therefore cannot reproduce `schema.prisma`.

## Replacement

Active baseline:

`prisma/migrations/20260801000000_baseline_schema`

Generated with:

```bash
prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

See `MIGRATION_BASELINE.md` for production cutover steps.
